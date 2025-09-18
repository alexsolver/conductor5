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
import { SlaLedSimple } from "@/components/SlaLedSimple";

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
  // 🎯 [1QA-COMPLIANCE] Dados da empresa vindos do JOIN no backend
  company_name?: string;
  company_display_name?: string;
  // Dados do caller vindos do JOIN no backend
  caller_name?: string;
  caller_first_name?: string;
  caller_last_name?: string;
  caller_email?: string;
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
  const { data: ticket, isLoading: isTicketLoading, error: ticketError } = useQuery<Ticket>({
    queryKey: [`/api/tickets/${id}`],
    enabled: !!id,
    retry: (failureCount, error: any) => {
      // Se for erro 401 (não autorizado), não tenta novamente
      if (error?.message?.includes('401')) {
        console.log('🚫 [TICKET-QUERY] Authentication error, redirecting to login');
        // Don't force redirect following 1qa.md - let components handle auth state
        console.log('Auth error in TicketDetail - components will handle auth state');
        return false;
      }
      return failureCount < 3;
    },
    select: (data: any) => {
      console.log('🎫 [TICKET-QUERY] Raw response:', data);
      if (!data) {
        console.log('❌ [TICKET-QUERY] No data received from API');
        return null;
      }
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
    console.log('🎫 [TICKET-DEBUG] Current ticket data:', {
      id: ticket?.id,
      companyId: ticket?.companyId,
      company_name: (ticket as any)?.company_name,
      company_display_name: (ticket as any)?.company_display_name,
      fullTicketData: ticket
    });
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

  // 🔒 [1QA-COMPLIANCE] Filter sensitive information for display
  const shouldDisplayBeneficiaryField = (fieldName: string, value: any) => {
    // Hide sensitive fields like email, phone, address for beneficiaries
    const sensitiveFields = ['email', 'telefone', 'endereco', 'clienteMaiusculas'];
    return !sensitiveFields.includes(fieldName) && value && value !== 'Não informado' && value !== 'Não especificado';
  };

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

  if (ticketError) {
    console.log('❌ [TICKET-DETAIL] Error loading ticket:', ticketError);
    if (ticketError.message?.includes('401')) {
      return (
        <div className="container mx-auto p-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Sessão expirada</h1>
            <p className="text-gray-600 mb-4">Faça login novamente para continuar</p>
            <Button onClick={() => console.log('Auth redirect blocked per 1qa.md')}>
              Login será tratado automaticamente
            </Button>
          </div>
        </div>
      );
    }
  }

  if (!ticket) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">{t('tickets.messages.not_found')}</h1>
          <Button onClick={() => navigate('/tickets')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('tickets.actions.back_to_tickets')}
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
            {t('common.back')}
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
              <SlaLedSimple ticketId={ticket.id} size="lg" />
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
                {t('tickets.description')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose max-w-none">
                <p className="text-gray-700 whitespace-pre-wrap">
                  {ticket.description || t('tickets.messages.no_description')}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Tabs for detailed content */}
          <Tabs defaultValue="attachments" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="attachments" className="flex items-center">
                <Paperclip className="h-4 w-4 mr-2" />
                {t('tickets.attachments')} ({attachments?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="communications" className="flex items-center">
                <MessageSquare className="h-4 w-4 mr-2" />
                {t('tickets.communication')} ({communications?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="notes">
                {t('tickets.notes')} ({notes?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="history" className="flex items-center">
                <History className="h-4 w-4 mr-2" />
                {t('tickets.history')}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="attachments" className="space-y-4">
              {/* Upload Component */}
              <Card>
                <CardHeader>
                  <CardTitle>{t('tickets.upload_attachments')}</CardTitle>
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
                  <CardTitle>{t('tickets.existing_attachments')}</CardTitle>
                </CardHeader>
                <CardContent>
                  {isAttachmentsLoading ? (
                    <div className="text-center py-4">{t('common.loading_attachments')}</div>
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
                                {t('tickets.uploaded_by', { name: attachment.uploadedByName })} • 
                                {formatDate(attachment.createdAt)}
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownloadAttachment(attachment.id, attachment.originalName)}
                          >
                            {t('common.download')}
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      {t('tickets.messages.no_attachments')}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="communications">
              <Card>
                <CardHeader>
                  <CardTitle>{t('tickets.communication')}</CardTitle>
                </CardHeader>
                <CardContent>
                  {isCommunicationsLoading ? (
                    <div className="text-center py-4">{t('common.loading_communications')}</div>
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
                          <p className="text-sm text-gray-500 mt-1">{t('common.by')}: {comm.authorName}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      {t('tickets.messages.no_communications')}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="notes">
              <Card>
                <CardHeader>
                  <CardTitle>{t('tickets.notes')}</CardTitle>
                </CardHeader>
                <CardContent>
                  {isNotesLoading ? (
                    <div className="text-center py-4">{t('common.loading_notes')}</div>
                  ) : notes && notes.length > 0 ? (
                    <div className="space-y-4">
                      {notes.map((note) => (
                        <div key={note.id} className="border rounded-lg p-4">
                          <div className="flex justify-between items-start mb-2">
                            <Badge variant={note.isInternal ? 'destructive' : 'default'}>
                              {note.isInternal ? t('tickets.note_internal') : t('tickets.note_public')}
                            </Badge>
                            <span className="text-sm text-gray-500">
                              {formatDate(note.createdAt)}
                            </span>
                          </div>
                          <p className="text-gray-700 whitespace-pre-wrap">{note.content}</p>
                          <p className="text-sm text-gray-500 mt-2">{t('common.by')}: {note.authorName}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      {t('tickets.messages.no_notes')}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="history">
              <Card>
                <CardHeader>
                  <CardTitle>{t('tickets.change_history')}</CardTitle>
                </CardHeader>
                <CardContent>
                  {isHistoryLoading ? (
                    <div className="text-center py-4">{t('common.loading_history')}</div>
                  ) : history && history.length > 0 ? (
                    <div className="space-y-3">
                      {history.map((entry) => (
                        <div key={entry.id} className="border-l-2 border-gray-200 pl-4 py-2">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium text-gray-900">{entry.description}</p>
                              {entry.fieldName && (
                                <p className="text-sm text-gray-600">
                                  {t('tickets.field')}: {entry.fieldName}
                                  {entry.oldValue && entry.newValue && (
                                    <span> • {entry.oldValue} → {entry.newValue}</span>
                                  )}
                                </p>
                              )}
                              <p className="text-sm text-gray-500">{t('common.by')}: {entry.performedByName}</p>
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
                      {t('tickets.messages.no_history')}
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
              <CardTitle>{t('tickets.ticket_information')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center text-sm">
                <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                <span className="text-gray-500">{t('tickets.created')}:</span>
                <span className="ml-2 font-medium">{formatDate(ticket.createdAt)}</span>
              </div>
              
              <div className="flex items-center text-sm">
                <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                <span className="text-gray-500">{t('tickets.updated')}:</span>
                <span className="ml-2 font-medium">{formatDate(ticket.updatedAt)}</span>
              </div>

              {ticket.assignedToId && (
                <div className="flex items-center text-sm">
                  <User className="h-4 w-4 mr-2 text-gray-400" />
                  <span className="text-gray-500">{t('tickets.assigned_to')}:</span>
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
                  <span className="text-gray-500">{t('tickets.company')}:</span>
                  <span className="ml-2 font-medium">
                    {(ticket as any)?.company_name || (ticket as any)?.company_display_name || company?.name || ticket.companyId}
                  </span>
                </div>
              )}

              {ticket.locationId && (
                <div className="flex items-center text-sm">
                  <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                  <span className="text-gray-500">{t('tickets.location')}:</span>
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