import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams } from "wouter";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { TicketAttachmentUpload } from "@/components/TicketAttachmentUpload";
import { DynamicBadge } from "@/components/DynamicBadge";
import { useFieldColors } from "@/hooks/useFieldColors";
import { ArrowLeft, Calendar, User, Building, MapPin, FileText, MessageSquare, History, Paperclip } from "lucide-react";
import { useLocation } from "wouter";
import { useLocalization } from "@/hooks/useLocalization";

interface Ticket {
  id: string;
  number: string;
  subject: string;
  description: string;
  status: string;
  priority: string;
  category: string;
  subcategory?: string;
  action?: string;
  createdAt: string;
  updatedAt: string;
  customerId?: string;
  assignedToId?: string;
  companyId?: string;
  locationId?: string;
  beneficiaryId?: string;
}

interface Attachment {
  id: string;
  fileName: string;
  originalName: string;
  fileSize: number;
  mimeType: string;
  createdAt: string;
  uploadedByName: string;
}

interface Communication {
  id: string;
  type: string;
  direction: string;
  content: string;
  createdAt: string;
  authorName: string;
}

interface Note {
  id: string;
  content: string;
  isInternal: boolean;
  createdAt: string;
  authorName: string;
}

interface HistoryEntry {
  id: string;
  actionType: string;
  description: string;
  fieldName?: string;
  oldValue?: string;
  newValue?: string;
  createdAt: string;
  performedByName: string;
}

export default function TicketDetail() {
  const { id } = useParams();
  const [, navigate] = useLocation();
  const { t } = useTranslation();
  const { formatDate } = useLocalization();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { getFieldLabel } = useFieldColors();

  // Fetch ticket details
  const { data: ticket, isLoading: isTicketLoading } = useQuery<Ticket>({
    queryKey: [`/api/tickets/${id}`],
    enabled: !!id,
    select: (data: any) => {
      console.log('🎫 [TICKET-QUERY] Raw response:', data);
      return data?.data || data;
    },
  });

  // Fetch attachments
  const { data: attachments, isLoading: isAttachmentsLoading } = useQuery<Attachment[]>({
    queryKey: [`/api/tickets/${id}/attachments`],
    enabled: !!id,
    select: (data: any) => data?.data || [],
  });

  // Fetch communications
  const { data: communications, isLoading: isCommunicationsLoading } = useQuery<Communication[]>({
    queryKey: [`/api/tickets/${id}/communications`],
    enabled: !!id,
    select: (data: any) => data?.data || [],
  });

  // Fetch notes
  const { data: notes, isLoading: isNotesLoading } = useQuery<Note[]>({
    queryKey: [`/api/tickets/${id}/notes`],
    enabled: !!id,
    select: (data: any) => data?.data || [],
  });

  // Fetch history
  const { data: history, isLoading: isHistoryLoading } = useQuery<HistoryEntry[]>({
    queryKey: [`/api/tickets/${id}/history`],
    enabled: !!id,
    select: (data: any) => data?.data || [],
  });

  // 🎯 [1QA-COMPLIANCE] Fetch company details for proper display
  const { data: company, error: companyError } = useQuery({
    queryKey: [`/api/companies/${ticket?.companyId}`],
    enabled: !!ticket?.companyId,
    select: (data: any) => {
      console.log('🏢 [COMPANY-QUERY] Raw response:', data);
      return data?.data || data;
    },
    retry: false,
  });

  // 🎯 [1QA-COMPLIANCE] Debug company loading
  useEffect(() => {
    console.log('🎫 [TICKET-DEBUG] Current ticket:', ticket);
    if (ticket?.companyId) {
      console.log('🏢 [COMPANY-DEBUG] Attempting to load company:', ticket.companyId);
    }
    if (companyError) {
      console.error('❌ [COMPANY-DEBUG] Error loading company:', companyError);
    }
    if (company) {
      console.log('✅ [COMPANY-DEBUG] Company loaded:', company);
    }
  }, [ticket, ticket?.companyId, company, companyError]);

  // 🎯 [1QA-COMPLIANCE] Fetch user details for assigned user display  
  const { data: assignedUser } = useQuery({
    queryKey: [`/api/users/${ticket?.assignedToId}`],
    enabled: !!ticket?.assignedToId,
    select: (data: any) => data?.data || data,
  });

  // 🎯 [1QA-COMPLIANCE] Fetch location details for proper display
  const { data: location } = useQuery({
    queryKey: [`/api/locations/${ticket?.locationId}`],
    enabled: !!ticket?.locationId,
    select: (data: any) => data?.data || data,
  });

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleDownloadAttachment = (attachmentId: string, originalName: string) => {
    const downloadUrl = `/api/tickets/${id}/attachments/${attachmentId}/download`;
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = originalName;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleUploadComplete = () => {
    // Refresh attachments after upload
    queryClient.invalidateQueries({ queryKey: [`/api/tickets/${id}/attachments`] });
    queryClient.invalidateQueries({ queryKey: [`/api/tickets/${id}`] });
    toast({
      title: 'Upload successful',
      description: 'Files uploaded successfully.',
    });
  };

  if (isTicketLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded-md w-1/3 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded-md"></div>
        </div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Ticket não encontrado</h1>
          <Button onClick={() => navigate('/tickets')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar aos Tickets
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={() => navigate('/tickets')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              #{ticket.number} - {ticket.subject}
            </h1>
            <div className="flex items-center space-x-2 mt-2">
              <DynamicBadge 
                fieldName="status" 
                value={ticket.status}
                showIcon={true}
                size="sm"
              >
                {getFieldLabel('status', ticket.status)}
              </DynamicBadge>
              <DynamicBadge 
                fieldName="priority" 
                value={ticket.priority}
                showIcon={true}
                size="sm"
              >
                {getFieldLabel('priority', ticket.priority)}
              </DynamicBadge>
              {ticket.category && (
                <DynamicBadge 
                  fieldName="category" 
                  value={ticket.category}
                  showIcon={false}
                  size="sm"
                >
                  {getFieldLabel('category', ticket.category)}
                </DynamicBadge>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                Descrição
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose max-w-none">
                <p className="text-gray-700 whitespace-pre-wrap">
                  {ticket.description || 'Nenhuma descrição fornecida.'}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Tabs for detailed content */}
          <Tabs defaultValue="attachments" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="attachments" className="flex items-center">
                <Paperclip className="h-4 w-4 mr-2" />
                Anexos ({attachments?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="communications" className="flex items-center">
                <MessageSquare className="h-4 w-4 mr-2" />
                Comunicações ({communications?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="notes">
                Notas ({notes?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="history" className="flex items-center">
                <History className="h-4 w-4 mr-2" />
                Histórico
              </TabsTrigger>
            </TabsList>

            <TabsContent value="attachments" className="space-y-4">
              {/* Upload Component */}
              <Card>
                <CardHeader>
                  <CardTitle>Upload de Anexos</CardTitle>
                </CardHeader>
                <CardContent>
                  <TicketAttachmentUpload 
                    ticketId={ticket.id}
                    onUploadComplete={handleUploadComplete}
                  />
                </CardContent>
              </Card>

              {/* Existing Attachments */}
              <Card>
                <CardHeader>
                  <CardTitle>Anexos Existentes</CardTitle>
                </CardHeader>
                <CardContent>
                  {isAttachmentsLoading ? (
                    <div className="text-center py-4">Carregando anexos...</div>
                  ) : attachments && attachments.length > 0 ? (
                    <div className="space-y-3">
                      {attachments.map((attachment) => (
                        <div 
                          key={attachment.id}
                          className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                        >
                          <div className="flex items-center space-x-3">
                            <Paperclip className="h-5 w-5 text-gray-400" />
                            <div>
                              <p className="font-medium text-gray-900">
                                {attachment.originalName}
                              </p>
                              <p className="text-sm text-gray-500">
                                {formatFileSize(attachment.fileSize)} • 
                                Enviado por {attachment.uploadedByName} • 
                                {formatDate(attachment.createdAt)}
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownloadAttachment(attachment.id, attachment.originalName)}
                          >
                            Download
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      Nenhum anexo encontrado.
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="communications">
              <Card>
                <CardHeader>
                  <CardTitle>Comunicações</CardTitle>
                </CardHeader>
                <CardContent>
                  {isCommunicationsLoading ? (
                    <div className="text-center py-4">Carregando comunicações...</div>
                  ) : communications && communications.length > 0 ? (
                    <div className="space-y-4">
                      {communications.map((comm) => (
                        <div key={comm.id} className="border-l-4 border-blue-400 pl-4 py-2">
                          <div className="flex justify-between items-start mb-2">
                            <Badge variant={comm.direction === 'inbound' ? 'default' : 'secondary'}>
                              {comm.type} - {comm.direction}
                            </Badge>
                            <span className="text-sm text-gray-500">
                              {formatDate(comm.createdAt)}
                            </span>
                          </div>
                          <p className="text-gray-700">{comm.content}</p>
                          <p className="text-sm text-gray-500 mt-1">Por: {comm.authorName}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      Nenhuma comunicação encontrada.
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="notes">
              <Card>
                <CardHeader>
                  <CardTitle>Notas</CardTitle>
                </CardHeader>
                <CardContent>
                  {isNotesLoading ? (
                    <div className="text-center py-4">Carregando notas...</div>
                  ) : notes && notes.length > 0 ? (
                    <div className="space-y-4">
                      {notes.map((note) => (
                        <div key={note.id} className="border rounded-lg p-4">
                          <div className="flex justify-between items-start mb-2">
                            <Badge variant={note.isInternal ? 'destructive' : 'default'}>
                              {note.isInternal ? 'Interna' : 'Pública'}
                            </Badge>
                            <span className="text-sm text-gray-500">
                              {formatDate(note.createdAt)}
                            </span>
                          </div>
                          <p className="text-gray-700 whitespace-pre-wrap">{note.content}</p>
                          <p className="text-sm text-gray-500 mt-2">Por: {note.authorName}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      Nenhuma nota encontrada.
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="history">
              <Card>
                <CardHeader>
                  <CardTitle>Histórico de Alterações</CardTitle>
                </CardHeader>
                <CardContent>
                  {isHistoryLoading ? (
                    <div className="text-center py-4">Carregando histórico...</div>
                  ) : history && history.length > 0 ? (
                    <div className="space-y-3">
                      {history.map((entry) => (
                        <div key={entry.id} className="border-l-2 border-gray-200 pl-4 py-2">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium text-gray-900">{entry.description}</p>
                              {entry.fieldName && (
                                <p className="text-sm text-gray-600">
                                  Campo: {entry.fieldName}
                                  {entry.oldValue && entry.newValue && (
                                    <span> • {entry.oldValue} → {entry.newValue}</span>
                                  )}
                                </p>
                              )}
                              <p className="text-sm text-gray-500">Por: {entry.performedByName}</p>
                            </div>
                            <span className="text-sm text-gray-500">
                              {formatDate(entry.createdAt)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      Nenhum histórico encontrado.
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Column - Sidebar Info */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informações do Ticket</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center text-sm">
                <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                <span className="text-gray-500">Criado:</span>
                <span className="ml-2 font-medium">{formatDate(ticket.createdAt)}</span>
              </div>
              
              <div className="flex items-center text-sm">
                <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                <span className="text-gray-500">Atualizado:</span>
                <span className="ml-2 font-medium">{formatDate(ticket.updatedAt)}</span>
              </div>

              {ticket.assignedToId && (
                <div className="flex items-center text-sm">
                  <User className="h-4 w-4 mr-2 text-gray-400" />
                  <span className="text-gray-500">Responsável:</span>
                  <span className="ml-2 font-medium">
                    {assignedUser?.firstName && assignedUser?.lastName 
                      ? `${assignedUser.firstName} ${assignedUser.lastName}`
                      : assignedUser?.email || ticket.assignedToId
                    }
                  </span>
                </div>
              )}

              {ticket.companyId && (
                <div className="flex items-center text-sm">
                  <Building className="h-4 w-4 mr-2 text-gray-400" />
                  <span className="text-gray-500">Empresa:</span>
                  <span className="ml-2 font-medium">
                    {company?.name || ticket.companyId}
                  </span>
                </div>
              )}

              {ticket.locationId && (
                <div className="flex items-center text-sm">
                  <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                  <span className="text-gray-500">Local:</span>
                  <span className="ml-2 font-medium">
                    {location?.name || location?.address || ticket.locationId}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}