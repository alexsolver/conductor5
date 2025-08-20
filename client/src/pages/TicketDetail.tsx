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
// import useLocalization from "@/hooks/useLocalization";
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
    queryKey: ["
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
    queryKey: ["/attachments`],
    enabled: !!id,
    select: (data: any) => data?.data || [],
  });

  // Fetch communications
  const { data: communications, isLoading: isCommunicationsLoading } = useQuery<Communication[]>({
    queryKey: ["/communications`],
    enabled: !!id,
    select: (data: any) => data?.data || [],
  });

  // Fetch notes
  const { data: notes, isLoading: isNotesLoading } = useQuery<Note[]>({
    queryKey: ["/notes`],
    enabled: !!id,
    select: (data: any) => data?.data || [],
  });

  // Fetch history
  const { data: history, isLoading: isHistoryLoading } = useQuery<HistoryEntry[]>({
    queryKey: ["/history`],
    enabled: !!id,
    select: (data: any) => data?.data || [],
  });

  // 🎯 [1QA-COMPLIANCE] Fetch company details for proper display
  const { data: company, error: companyError } = useQuery({
    queryKey: ["
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
    queryKey: ["
    enabled: !!ticket?.assignedToId,
    select: (data: any) => data?.data || data,
  });

  // 🎯 [1QA-COMPLIANCE] Fetch location details for proper display
  const { data: location } = useQuery({
    queryKey: ["
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
    const downloadUrl = "/download`;
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
    queryClient.invalidateQueries({ queryKey: ["/attachments`] });
    queryClient.invalidateQueries({ queryKey: ["
    toast({
      title: '[TRANSLATION_NEEDED]',
      description: 'Files uploaded successfully.',
    });
  };

  if (isTicketLoading) {
    return (
      <div className=""
        <div className=""
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
        <div className=""
          <div className=""
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
      <div className=""
        <div className=""
          <h1 className="text-2xl font-bold text-gray-900 mb-4">'[TRANSLATION_NEEDED]'</h1>
          <Button onClick={() => navigate('/tickets')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            '[TRANSLATION_NEEDED]'
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className=""
      {/* Header */}
      <div className=""
        <div className=""
          <Button variant="ghost" onClick={() => navigate('/tickets')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            '[TRANSLATION_NEEDED]'
          </Button>
          <div>
            <h1 className=""
              #{ticket.number} - {ticket.subject}
            </h1>
            <div className=""
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
      <div className=""
        {/* Left Column - Main Content */}
        <div className=""
          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle className=""
                <FileText className="h-5 w-5 mr-2" />
                '[TRANSLATION_NEEDED]'
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className=""
                <p className=""
                  {ticket.description || t('tickets.messages.no_description')}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Tabs for detailed content */}
          <Tabs defaultValue="attachments" className=""
            <TabsList className=""
              <TabsTrigger value="attachments" className=""
                <Paperclip className="h-4 w-4 mr-2" />
                '[TRANSLATION_NEEDED]' ({attachments?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="communications" className=""
                <MessageSquare className="h-4 w-4 mr-2" />
                '[TRANSLATION_NEEDED]' ({communications?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="notes>
                '[TRANSLATION_NEEDED]' ({notes?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="history" className=""
                <History className="h-4 w-4 mr-2" />
                '[TRANSLATION_NEEDED]'
              </TabsTrigger>
            </TabsList>

            <TabsContent value="attachments" className=""
              {/* Upload Component */}
              <Card>
                <CardHeader>
                  <CardTitle>'[TRANSLATION_NEEDED]'</CardTitle>
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
                  <CardTitle>'[TRANSLATION_NEEDED]'</CardTitle>
                </CardHeader>
                <CardContent>
                  {isAttachmentsLoading ? (
                    <div className="text-center py-4">'[TRANSLATION_NEEDED]'</div>
                  ) : attachments && attachments.length > 0 ? (
                    <div className=""
                      {attachments.map((attachment) => (
                        <div 
                          key={attachment.id}
                          className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                        >
                          <div className=""
                            <Paperclip className="h-5 w-5 text-gray-400" />
                            <div>
                              <p className=""
                                {attachment.originalName}
                              </p>
                              <p className=""
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
                            '[TRANSLATION_NEEDED]'
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className=""
                      '[TRANSLATION_NEEDED]'
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="communications>
              <Card>
                <CardHeader>
                  <CardTitle>'[TRANSLATION_NEEDED]'</CardTitle>
                </CardHeader>
                <CardContent>
                  {isCommunicationsLoading ? (
                    <div className="text-center py-4">'[TRANSLATION_NEEDED]'</div>
                  ) : communications && communications.length > 0 ? (
                    <div className=""
                      {communications.map((comm) => (
                        <div key={comm.id} className=""
                          <div className=""
                            <Badge variant={comm.direction === 'inbound' ? 'default' : 'secondary'}>
                              {comm.type} - {comm.direction}
                            </Badge>
                            <span className=""
                              {formatDate(comm.createdAt)}
                            </span>
                          </div>
                          <p className="text-gray-700">{comm.content}</p>
                          <p className="text-sm text-gray-500 mt-1">'[TRANSLATION_NEEDED]': {comm.authorName}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className=""
                      '[TRANSLATION_NEEDED]'
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="notes>
              <Card>
                <CardHeader>
                  <CardTitle>'[TRANSLATION_NEEDED]'</CardTitle>
                </CardHeader>
                <CardContent>
                  {isNotesLoading ? (
                    <div className="text-center py-4">'[TRANSLATION_NEEDED]'</div>
                  ) : notes && notes.length > 0 ? (
                    <div className=""
                      {notes.map((note) => (
                        <div key={note.id} className=""
                          <div className=""
                            <Badge variant={note.isInternal ? 'destructive' : 'default'}>
                              {note.isInternal ? t('tickets.note_internal') : t('tickets.note_public')}
                            </Badge>
                            <span className=""
                              {formatDate(note.createdAt)}
                            </span>
                          </div>
                          <p className="text-gray-700 whitespace-pre-wrap">{note.content}</p>
                          <p className="text-sm text-gray-500 mt-2">'[TRANSLATION_NEEDED]': {note.authorName}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className=""
                      '[TRANSLATION_NEEDED]'
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="history>
              <Card>
                <CardHeader>
                  <CardTitle>'[TRANSLATION_NEEDED]'</CardTitle>
                </CardHeader>
                <CardContent>
                  {isHistoryLoading ? (
                    <div className="text-center py-4">'[TRANSLATION_NEEDED]'</div>
                  ) : history && history.length > 0 ? (
                    <div className=""
                      {history.map((entry) => (
                        <div key={entry.id} className=""
                          <div className=""
                            <div>
                              <p className="font-medium text-gray-900">{entry.description}</p>
                              {entry.fieldName && (
                                <p className=""
                                  '[TRANSLATION_NEEDED]': {entry.fieldName}
                                  {entry.oldValue && entry.newValue && (
                                    <span> • {entry.oldValue} → {entry.newValue}</span>
                                  )}
                                </p>
                              )}
                              <p className="text-sm text-gray-500">'[TRANSLATION_NEEDED]': {entry.performedByName}</p>
                            </div>
                            <span className=""
                              {formatDate(entry.createdAt)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className=""
                      '[TRANSLATION_NEEDED]'
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Column - Sidebar Info */}
        <div className=""
          <Card>
            <CardHeader>
              <CardTitle>Informações do Ticket</CardTitle>
            </CardHeader>
            <CardContent className=""
              <div className=""
                <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                <span className="text-gray-500">Criado:</span>
                <span className="ml-2 font-medium">{formatDate(ticket.createdAt)}</span>
              </div>
              
              <div className=""
                <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                <span className="text-gray-500">Atualizado:</span>
                <span className="ml-2 font-medium">{formatDate(ticket.updatedAt)}</span>
              </div>

              {ticket.assignedToId && (
                <div className=""
                  <User className="h-4 w-4 mr-2 text-gray-400" />
                  <span className="text-gray-500">Responsável:</span>
                  <span className=""
                    {assignedUser?.firstName && assignedUser?.lastName 
                      ? "
                      : assignedUser?.email || ticket.assignedToId
                    }
                  </span>
                </div>
              )}

              {ticket.companyId && (
                <div className=""
                  <Building className="h-4 w-4 mr-2 text-gray-400" />
                  <span className="text-gray-500">Empresa:</span>
                  <span className=""
                    {(ticket as any)?.company_name || (ticket as any)?.company_display_name || company?.name || ticket.companyId}
                  </span>
                </div>
              )}

              {ticket.locationId && (
                <div className=""
                  <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                  <span className="text-gray-500">Local:</span>
                  <span className=""
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