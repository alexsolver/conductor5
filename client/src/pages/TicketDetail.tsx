import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { TicketAttachmentUpload } from "@/components/TicketAttachmentUpload";
import { DynamicBadge } from "@/components/DynamicBadge";
import { useFieldColors } from "@/hooks/useFieldColors";
import { useLocalization } from "@/hooks/useLocalization";
import { ArrowLeft, Calendar, User, Building, MapPin, FileText, MessageSquare, History, Paperclip } from "lucide-react";
import { useLocation } from "wouter";
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
  company_name?: string;
  company_display_name?: string;
  caller_name?: string;
  caller_first_name?: string;
  caller_last_name?: string;
  caller_email?: string;
  assigned_to_name?: string;
  assigned_to_first_name?: string;
  assigned_to_last_name?: string;
  beneficiary_name?: string;
  beneficiary_first_name?: string;
  beneficiary_last_name?: string;
  location_name?: string;
  location_address?: string;
}

interface Attachment {
  id: string;
  filename: string;
  size: number;
  mimetype: string;
  uploadedAt: string;
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
  const { t, formatDate } = useLocalization();

  const { id } = useParams();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { getFieldLabel } = useFieldColors();

  // Fetch ticket details
  const { data: ticket, isLoading: isTicketLoading, error: ticketError } = useQuery<Ticket>({
    queryKey: [`/api/tickets/${id}`],
    enabled: !!id,
    retry: (failureCount, error: any) => {
      if (error?.message?.includes('401')) {
        console.log('🚫 [TICKET-QUERY] Authentication error, redirecting to login');
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
  const { data: attachments = [], isLoading: isAttachmentsLoading } = useQuery<Attachment[]>({
    queryKey: [`/api/tickets/${id}/attachments`],
    enabled: !!id,
    select: (data: any) => data?.data || [],
  });

  // Fetch communications
  const { data: communications = [], isLoading: isCommunicationsLoading } = useQuery<Communication[]>({
    queryKey: [`/api/tickets/${id}/communications`],
    enabled: !!id,
    select: (data: any) => data?.data || [],
  });

  // Fetch notes
  const { data: notes = [], isLoading: isNotesLoading } = useQuery<Note[]>({
    queryKey: [`/api/tickets/${id}/notes`],
    enabled: !!id,
    select: (data: any) => data?.data || [],
  });

  // Fetch history
  const { data: history = [], isLoading: isHistoryLoading } = useQuery<HistoryEntry[]>({
    queryKey: [`/api/tickets/${id}/history`],
    enabled: !!id,
    select: (data: any) => data?.data || [],
  });

  if (isTicketLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-lg text-slate-600 dark:text-slate-300">{t('common.loading')}</span>
        </div>
      </div>
    );
  }

  if (ticketError || !ticket) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
            {t('tickets.notFound')}
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mb-4">
            {t('tickets.notFoundDescription')}
          </p>
          <Button onClick={() => navigate('/tickets')} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t('common.backToTickets')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/tickets')}
              className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t('common.back')}
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {ticket.number}
              </h1>
              <p className="text-slate-600 dark:text-slate-400">{ticket.subject}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <SlaLedSimple ticketId={ticket.id} />
          </div>
        </div>

        {/* Ticket Info Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Status & Priority */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">{t('tickets.statusAndPriority')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600 dark:text-slate-400">{t('tickets.status')}</span>
                <DynamicBadge fieldName="status" value={ticket.status} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600 dark:text-slate-400">{t('tickets.priority')}</span>
                <DynamicBadge fieldName="priority" value={ticket.priority} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600 dark:text-slate-400">{t('tickets.category')}</span>
                <DynamicBadge fieldName="category" value={ticket.category} />
              </div>
            </CardContent>
          </Card>

          {/* Assignment */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">{t('tickets.assignment')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center space-x-2">
                <User className="w-4 h-4 text-slate-400" />
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">{t('tickets.assignedTo')}</p>
                  <p className="text-sm font-medium">
                    {ticket.assigned_to_name || ticket.assigned_to_first_name 
                      ? `${ticket.assigned_to_first_name || ''} ${ticket.assigned_to_last_name || ''}`.trim()
                      : t('tickets.unassigned')}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Building className="w-4 h-4 text-slate-400" />
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">{t('tickets.company')}</p>
                  <p className="text-sm font-medium">
                    {ticket.company_display_name || ticket.company_name || t('tickets.noCompany')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Dates */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">{t('tickets.dates')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-slate-400" />
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">{t('tickets.created')}</p>
                  <p className="text-sm font-medium">{formatDate(ticket.createdAt)}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-slate-400" />
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">{t('tickets.updated')}</p>
                  <p className="text-sm font-medium">{formatDate(ticket.updatedAt)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="w-4 h-4" />
                <span>{t('tickets.description')}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div 
                className="prose dark:prose-invert max-w-none text-sm"
                dangerouslySetInnerHTML={{ __html: ticket.description }}
              />
            </CardContent>
          </Card>

          {/* Tabs */}
          <Card>
            <CardContent className="p-0">
              <Tabs defaultValue="attachments" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="attachments" className="flex items-center space-x-2">
                    <Paperclip className="w-4 h-4" />
                    <span>{t('tickets.attachments')}</span>
                    {attachments.length > 0 && (
                      <Badge variant="secondary" className="ml-1">
                        {attachments.length}
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="communications" className="flex items-center space-x-2">
                    <MessageSquare className="w-4 h-4" />
                    <span>{t('tickets.communications')}</span>
                    {communications.length > 0 && (
                      <Badge variant="secondary" className="ml-1">
                        {communications.length}
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="notes" className="flex items-center space-x-2">
                    <FileText className="w-4 h-4" />
                    <span>{t('tickets.notes')}</span>
                    {notes.length > 0 && (
                      <Badge variant="secondary" className="ml-1">
                        {notes.length}
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="history" className="flex items-center space-x-2">
                    <History className="w-4 h-4" />
                    <span>{t('tickets.history')}</span>
                    {history.length > 0 && (
                      <Badge variant="secondary" className="ml-1">
                        {history.length}
                      </Badge>
                    )}
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="attachments" className="p-4">
                  <TicketAttachmentUpload ticketId={ticket.id} />
                  {isAttachmentsLoading ? (
                    <div className="text-center py-4">
                      <div className="w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                    </div>
                  ) : attachments.length === 0 ? (
                    <p className="text-center text-slate-500 py-4">{t('tickets.noAttachments')}</p>
                  ) : (
                    <div className="space-y-2 mt-4">
                      {attachments.map((attachment) => (
                        <div key={attachment.id} className="flex items-center justify-between p-2 border rounded">
                          <div className="flex items-center space-x-2">
                            <Paperclip className="w-4 h-4 text-slate-400" />
                            <span className="text-sm">{attachment.filename}</span>
                            <span className="text-xs text-slate-500">
                              ({(attachment.size / 1024).toFixed(1)} KB)
                            </span>
                          </div>
                          <div className="text-xs text-slate-500">
                            {formatDate(attachment.uploadedAt)} - {attachment.uploadedByName}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="communications" className="p-4">
                  {isCommunicationsLoading ? (
                    <div className="text-center py-4">
                      <div className="w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                    </div>
                  ) : communications.length === 0 ? (
                    <p className="text-center text-slate-500 py-4">{t('tickets.noCommunications')}</p>
                  ) : (
                    <div className="space-y-4">
                      {communications.map((comm) => (
                        <div key={comm.id} className="border-l-4 border-blue-500 pl-4">
                          <div className="flex items-center justify-between mb-2">
                            <Badge variant={comm.direction === 'incoming' ? 'default' : 'secondary'}>
                              {comm.type} - {comm.direction}
                            </Badge>
                            <span className="text-xs text-slate-500">{formatDate(comm.createdAt)}</span>
                          </div>
                          <div className="text-sm">{comm.content}</div>
                          <div className="text-xs text-slate-500 mt-1">{comm.authorName}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="notes" className="p-4">
                  {isNotesLoading ? (
                    <div className="text-center py-4">
                      <div className="w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                    </div>
                  ) : notes.length === 0 ? (
                    <p className="text-center text-slate-500 py-4">{t('tickets.noNotes')}</p>
                  ) : (
                    <div className="space-y-4">
                      {notes.map((note) => (
                        <div key={note.id} className="border rounded p-3">
                          <div className="flex items-center justify-between mb-2">
                            <Badge variant={note.isInternal ? 'secondary' : 'outline'}>
                              {note.isInternal ? t('tickets.internal') : t('tickets.public')}
                            </Badge>
                            <span className="text-xs text-slate-500">{formatDate(note.createdAt)}</span>
                          </div>
                          <div className="text-sm">{note.content}</div>
                          <div className="text-xs text-slate-500 mt-1">{note.authorName}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="history" className="p-4">
                  {isHistoryLoading ? (
                    <div className="text-center py-4">
                      <div className="w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                    </div>
                  ) : history.length === 0 ? (
                    <p className="text-center text-slate-500 py-4">{t('tickets.noHistory')}</p>
                  ) : (
                    <div className="space-y-3">
                      {history.map((entry) => (
                        <div key={entry.id} className="flex items-start space-x-3">
                          <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                          <div className="flex-1">
                            <div className="text-sm font-medium">{entry.description}</div>
                            {entry.fieldName && (
                              <div className="text-xs text-slate-500">
                                {entry.fieldName}: {entry.oldValue} → {entry.newValue}
                              </div>
                            )}
                            <div className="text-xs text-slate-500">
                              {formatDate(entry.createdAt)} - {entry.performedByName}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}