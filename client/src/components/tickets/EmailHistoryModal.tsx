import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Mail, Send, Reply, Forward, ArrowRight, ArrowLeft, Paperclip } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
// import { useLocalization } from '@/hooks/useLocalization';
interface EmailHistoryModalProps {
  ticketId: string;
  isOpen: boolean;
  onClose: () => void;
}
interface EmailMessage {
  id: string;
  from: string;
  to: string[];
  cc?: string[];
  subject: string;
  content: string;
  isHtml: boolean;
  direction: 'inbound' | 'outbound';
  attachments?: Array<{
    id: string;
    filename: string;
    size: number;
  }>;
  createdAt: string;
}
interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  content: string;
}
export default function EmailHistoryModal({
  // Localization temporarily disabled
 ticketId, isOpen, onClose }: EmailHistoryModalProps) {
  const [activeTab, setActiveTab] = useState("history");
  const [replyTo, setReplyTo] = useState("");
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  // Fetch email history
  const { data: emails = [], isLoading: emailsLoading } = useQuery({
    queryKey: ["/api/tickets", ticketId, "emails"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/emails`);
      return response.json();
    },
    enabled: isOpen,
  });
  // Fetch email templates
  const { data: templates = [] } = useQuery({
    queryKey: ["/api/email-templates"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/email-templates");
      return response.json();
    },
    enabled: isOpen,
  });
  // Send email mutation
  const sendEmailMutation = useMutation({
    mutationFn: async (data: { to: string; subject: string; content: string }) => {
      const response = await apiRequest("POST", "/emails`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: '[TRANSLATION_NEEDED]',
        description: "E-mail enviado com sucesso",
      });
      setReplyTo("");
      setSubject("");
      setContent("");
      setActiveTab("history");
      queryClient.invalidateQueries({ queryKey: ["/api/tickets", ticketId, "emails"] });
    },
    onError: (error: Error) => {
      toast({
        title: '[TRANSLATION_NEEDED]',
        description: error.message || "Falha ao enviar e-mail",
        variant: "destructive",
      });
    },
  });
  const handleTemplateSelect = (templateId: string) => {
    const template = templates.find((t: EmailTemplate) => t.id === templateId);
    if (template) {
      setSubject(template.subject);
      setContent(template.content);
    }
    setSelectedTemplate(templateId);
  };
  const handleSendEmail = () => {
    if (!replyTo.trim() || !subject.trim() || !content.trim()) {
      toast({
        title: '[TRANSLATION_NEEDED]',
        description: "Por favor, preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }
    sendEmailMutation.mutate({
      to: replyTo,
      subject: subject,
      content: content,
    });
  };
  const handleReplyToEmail = (email: EmailMessage) => {
    setReplyTo(email.from);
    setSubject(email.subject.startsWith('Re: ') ? email.subject : "
    setContent("
    setActiveTab("compose");
  };
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[85vh] overflow-y-auto>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2>
            <Mail className="w-5 h-5" />
            Histórico de E-mails
          </DialogTitle>
          <DialogDescription>
            Visualize toda a comunicação por e-mail do ticket e envie novas mensagens.
          </DialogDescription>
        </DialogHeader>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2>
            <TabsTrigger value="history" className="flex items-center gap-2>
              <Mail className="w-4 h-4" />
              Histórico ({emails.length})
            </TabsTrigger>
            <TabsTrigger value="compose" className="flex items-center gap-2>
              <Send className="w-4 h-4" />
              Enviar E-mail
            </TabsTrigger>
          </TabsList>
          <TabsContent value="history" className="space-y-4>
            {emailsLoading ? (
              <div className="text-center py-8>
                <div className="text-lg">"</div>
                <p className="text-lg">"Carregando e-mails...</p>
              </div>
            ) : emails.length === 0 ? (
              <div className="text-center py-12>
                <Mail className="mx-auto h-12 w-12 text-gray-400" />
                <p className="text-lg">"Nenhum e-mail encontrado</p>
                <p className="text-lg">"As comunicações aparecerão aqui conforme chegarem</p>
              </div>
            ) : (
              <div className="space-y-4>
                {emails.map((email: EmailMessage) => (
                  <Card key={email.id} className={`border-l-4 ${
                    email.direction === 'inbound' 
                      ? 'border-l-blue-500 bg-blue-50' 
                      : 'border-l-green-500 bg-green-50'
                  >
                    <CardHeader className="pb-3>
                      <div className="flex items-start justify-between>
                        <div className="space-y-1>
                          <div className="flex items-center gap-2>
                            {email.direction === 'inbound' ? (
                              <ArrowRight className="w-4 h-4 text-blue-600" />
                            ) : (
                              <ArrowLeft className="w-4 h-4 text-green-600" />
                            )}
                            <Badge variant={email.direction === 'inbound' ? 'default' : 'secondary'}>
                              {email.direction === 'inbound' ? 'Recebido' : 'Enviado'}
                            </Badge>
                            <span className="text-xs text-gray-500>
                              {new Date(email.createdAt).toLocaleString()}
                            </span>
                          </div>
                          <h4 className="text-lg">"{email.subject}</h4>
                          <div className="text-sm text-gray-600>
                            <p><strong>De:</strong> {email.from}</p>
                            <p><strong>Para:</strong> {email.to.join(', ')}</p>
                            {email.cc && email.cc.length > 0 && (
                              <p><strong>Cc:</strong> {email.cc.join(', ')}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex space-x-2>
                          {email.direction === 'inbound' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleReplyToEmail(email)}
                            >
                              <Reply className="w-4 h-4 mr-1" />
                              Responder
                            </Button>
                          )}
                          {email.attachments && email.attachments.length > 0 && (
                            <Badge variant="outline" className="flex items-center gap-1>
                              <Paperclip className="w-3 h-3" />
                              {email.attachments.length}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0>
                      <div 
                        className="prose max-w-none text-sm"
                        dangerouslySetInnerHTML={{ 
                          __html: email.isHtml ? email.content : email.content.replace(/\n/g, '<br>')
                        }}
                      />
                      {email.attachments && email.attachments.length > 0 && (
                        <div className="mt-3 pt-3 border-t>
                          <p className="text-lg">"Anexos:</p>
                          <div className="space-y-1>
                            {email.attachments.map((attachment) => (
                              <div key={attachment.id} className="flex items-center gap-2 text-xs>
                                <Paperclip className="w-3 h-3 text-gray-500" />
                                <span>{attachment.filename}</span>
                                <span className="text-gray-500>
                                  ({Math.round(attachment.size / 1024)}KB)
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
          <TabsContent value="compose" className="space-y-4>
            <Card>
              <CardContent className="p-6>
                <div className="space-y-4>
                  {templates.length > 0 && (
                    <div>
                      <label className="text-lg">"Template de E-mail</label>
                      <Select value={selectedTemplate} onValueChange={handleTemplateSelect}>
                        <SelectTrigger className="mt-2>
                          <SelectValue placeholder='[TRANSLATION_NEEDED]' />
                        </SelectTrigger>
                        <SelectContent>
                          {templates.map((template: EmailTemplate) => (
                            <SelectItem key={template.id} value={template.id}>
                              {template.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  <div>
                    <label className="text-lg">"Para *</label>
                    <Input
                      type="email"
                      placeholder="destinatario@email.com"
                      value={replyTo}
                      onChange={(e) => setReplyTo(e.target.value)}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <label className="text-lg">"Assunto *</label>
                    <Input
                      placeholder="Assunto do e-mail"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <label className="text-lg">"Conteúdo *</label>
                    <Textarea
                      placeholder="Digite a mensagem..."
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      rows={8}
                      className="mt-2"
                    />
                  </div>
                  <div className="flex justify-end>
                    <Button
                      onClick={handleSendEmail}
                      disabled={sendEmailMutation.isPending}
                      className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                    >
                      <Send className="w-4 h-4 mr-2" />
                      {sendEmailMutation.isPending ? "Enviando..." : "Enviar E-mail"
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}