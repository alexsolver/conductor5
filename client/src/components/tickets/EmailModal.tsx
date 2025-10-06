import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Mail, 
  Send,
  Paperclip,
  Upload,
  X,
  Plus,
  AlertCircle,
  Wand2,
  Languages,
  FileText,
  Sparkles,
  MessageSquarePlus,
  CheckCircle,
  Loader2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

// Schema de validação para email
const emailSchema = z.object({
  to: z.string().email("Email inválido").min(1, "Destinatário é obrigatório"),
  cc: z.string().optional(),
  bcc: z.string().optional(),
  subject: z.string().min(1, "Assunto é obrigatório"),
  message: z.string().min(1, "Mensagem é obrigatória"),
  attachments: z.array(z.any()).optional(),
});

type EmailFormData = z.infer<typeof emailSchema>;

interface EmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticketId: string;
  ticketSubject?: string;
}

export default function EmailModal({ isOpen, onClose, ticketId, ticketSubject }: EmailModalProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isDragActive, setIsDragActive] = useState(false);

  const form = useForm<EmailFormData>({
    resolver: zodResolver(emailSchema),
    mode: "onBlur", // Valida apenas ao sair do campo, não a cada tecla
    defaultValues: {
      to: "",
      cc: "",
      bcc: "",
      subject: ticketSubject ? `Re: ${ticketSubject}` : "",
      message: "",
      attachments: [],
    },
  });

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      form.reset({
        to: "",
        cc: "",
        bcc: "",
        subject: ticketSubject ? `Re: ${ticketSubject}` : "",
        message: "",
        attachments: [],
      });
      setAttachments([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, ticketSubject]);

  // Mutation para enviar email
  const sendEmailMutation = useMutation({
    mutationFn: async (data: EmailFormData) => {
      const formData = new FormData();
      formData.append('ticketId', ticketId);
      formData.append('to', data.to);
      formData.append('subject', data.subject);
      formData.append('message', data.message);
      
      if (data.cc) formData.append('cc', data.cc);
      if (data.bcc) formData.append('bcc', data.bcc);
      
      // Adicionar anexos
      attachments.forEach((file, index) => {
        formData.append(`attachments`, file);
      });

      const response = await apiRequest("POST", `/api/tickets/${ticketId}/send-email`, formData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Email enviado",
        description: "O email foi enviado com sucesso.",
      });
      
      // Invalidar cache das comunicações e histórico
      queryClient.invalidateQueries({
        queryKey: ["/api/tickets", ticketId, "communications"],
      });
      queryClient.invalidateQueries({
        queryKey: ["/api/tickets", ticketId, "history"],
      });
      
      onClose();
    },
    onError: (error: any) => {
      console.error("Erro ao enviar email:", error);
      toast({
        title: "Erro ao enviar email",
        description: error.message || "Ocorreu um erro ao enviar o email.",
        variant: "destructive",
      });
    },
  });

  // AI mutations for message assistance
  const spellCheckMutation = useMutation({
    mutationFn: async () => {
      const currentMessage = form.getValues('message');
      const response = await apiRequest('POST', '/api/message-ai/spell-check', { text: currentMessage });
      return await response.json();
    },
    onSuccess: (data: any) => {
      // Só atualiza o texto se houver um texto corrigido válido
      if (data.correctedText && data.correctedText.trim()) {
        form.setValue('message', data.correctedText, {
          shouldValidate: true,
          shouldDirty: true,
          shouldTouch: true,
        });
      }
      
      if (data.suggestions && data.suggestions.length > 0) {
        toast({
          title: "Correções Aplicadas",
          description: `${data.suggestions.length} sugestões de correção aplicadas`,
        });
      } else {
        toast({
          title: "Texto Verificado",
          description: "Nenhuma correção necessária",
        });
      }
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Falha ao verificar ortografia",
        variant: "destructive",
      });
    },
  });

  const rewriteMutation = useMutation({
    mutationFn: async (tone: string) => {
      const currentMessage = form.getValues('message');
      const response = await apiRequest('POST', '/api/message-ai/rewrite', { text: currentMessage, tone });
      return await response.json();
    },
    onSuccess: (data: any) => {
      // Só atualiza o texto se houver um texto reescrito válido
      if (data.rewrittenText && data.rewrittenText.trim()) {
        form.setValue('message', data.rewrittenText, {
          shouldValidate: true,
          shouldDirty: true,
          shouldTouch: true,
        });
        toast({
          title: "Texto Reescrito",
          description: `Mensagem reescrita com tom ${data.tone}`,
        });
      } else {
        toast({
          title: "Aviso",
          description: "Não foi possível reescrever o texto",
          variant: "destructive",
        });
      }
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Falha ao reescrever texto",
        variant: "destructive",
      });
    },
  });

  const translateMutation = useMutation({
    mutationFn: async (targetLanguage: string) => {
      const currentMessage = form.getValues('message');
      console.log('🌍 [TRANSLATE-MUTATION] Starting:', { targetLanguage, messageLength: currentMessage?.length });
      const response = await apiRequest('POST', '/api/message-ai/translate', { text: currentMessage, targetLanguage });
      const data = await response.json();
      console.log('🌍 [TRANSLATE-MUTATION] Response:', data);
      return data;
    },
    onSuccess: (data: any) => {
      console.log('✅ [TRANSLATE-SUCCESS] Data received:', data);
      // Só atualiza o texto se houver um texto traduzido válido
      if (data.translatedText && data.translatedText.trim()) {
        console.log('📝 [TRANSLATE-SUCCESS] Updating field with:', data.translatedText.substring(0, 50));
        form.setValue('message', data.translatedText, {
          shouldValidate: true,
          shouldDirty: true,
          shouldTouch: true,
        });
        toast({
          title: "Texto Traduzido",
          description: `Mensagem traduzida para ${data.targetLanguage}`,
        });
      } else {
        console.warn('⚠️ [TRANSLATE-SUCCESS] No translatedText in response');
        toast({
          title: "Aviso",
          description: "Não foi possível traduzir o texto",
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      console.error('❌ [TRANSLATE-ERROR]:', error);
      toast({
        title: "Erro",
        description: "Falha ao traduzir texto",
        variant: "destructive",
      });
    },
  });

  const summarizeMutation = useMutation({
    mutationFn: async (length: 'short' | 'long') => {
      const currentMessage = form.getValues('message');
      const response = await apiRequest('POST', '/api/message-ai/summarize', { text: currentMessage, length });
      return await response.json();
    },
    onSuccess: (data: any) => {
      // Só atualiza o texto se houver um resumo válido
      if (data.summary && data.summary.trim()) {
        form.setValue('message', data.summary, {
          shouldValidate: true,
          shouldDirty: true,
          shouldTouch: true,
        });
        toast({
          title: "Texto Resumido",
          description: "Mensagem resumida com sucesso",
        });
      } else {
        toast({
          title: "Aviso",
          description: "Não foi possível resumir o texto",
          variant: "destructive",
        });
      }
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Falha ao resumir texto",
        variant: "destructive",
      });
    },
  });

  const quickReplyMutation = useMutation({
    mutationFn: async () => {
      const currentMessage = form.getValues('message');
      const response = await apiRequest('POST', '/api/message-ai/quick-reply', { text: currentMessage });
      return await response.json();
    },
    onSuccess: (data: any) => {
      if (data.suggestions && data.suggestions.length > 0 && data.suggestions[0].trim()) {
        form.setValue('message', data.suggestions[0], {
          shouldValidate: true,
          shouldDirty: true,
          shouldTouch: true,
        });
        toast({
          title: "Sugestão Aplicada",
          description: "Resposta rápida gerada com IA",
        });
      } else {
        toast({
          title: "Aviso",
          description: "Não foi possível gerar uma sugestão",
          variant: "destructive",
        });
      }
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Falha ao gerar sugestão",
        variant: "destructive",
      });
    },
  });

  // Handle file selection
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setAttachments(prev => [...prev, ...files]);
  };

  // Handle file removal
  const removeFile = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  // Handle drag and drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
    
    const files = Array.from(e.dataTransfer.files);
    setAttachments(prev => [...prev, ...files]);
  };

  const onSubmit = (data: EmailFormData) => {
    sendEmailMutation.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="modal-email">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-blue-600" />
            {t('tickets.sendEmail')}
          </DialogTitle>
          <DialogDescription>
            Envie um email relacionado ao ticket #{ticketId}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Campo Para */}
            <FormField
              control={form.control}
              name="to"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Para *</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="destinatario@exemplo.com"
                      type="email"
                      data-testid="input-email-to"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Campos CC e BCC */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="cc"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CC</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="copia@exemplo.com"
                        type="email"
                        data-testid="input-email-cc"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="bcc"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>BCC</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="copia-oculta@exemplo.com"
                        type="email"
                        data-testid="input-email-bcc"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Campo Assunto */}
            <FormField
              control={form.control}
              name="subject"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Assunto *</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Assunto do email"
                      data-testid="input-email-subject"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Campo Mensagem */}
            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mensagem *</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Digite sua mensagem aqui..."
                      rows={6}
                      data-testid="textarea-email-message"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* AI Tools */}
            <div className="space-y-2">
              <Label className="text-sm text-gray-600">🤖 Ferramentas de IA</Label>
              <div className="flex flex-wrap gap-2">
                {/* Spell Check */}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const msg = form.getValues('message');
                    if (!msg || !msg.trim()) {
                      toast({ title: "Digite uma mensagem primeiro", variant: "destructive" });
                      return;
                    }
                    spellCheckMutation.mutate();
                  }}
                  disabled={spellCheckMutation.isPending}
                  data-testid="button-spell-check-email"
                >
                  {spellCheckMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <CheckCircle className="h-4 w-4 mr-2" />
                  )}
                  Corrigir Ortografia
                </Button>

                {/* Rewrite Tone */}
                <Select onValueChange={(tone) => {
                  const msg = form.getValues('message');
                  if (!msg || !msg.trim()) {
                    toast({ title: "Digite uma mensagem primeiro", variant: "destructive" });
                    return;
                  }
                  rewriteMutation.mutate(tone);
                }}>
                  <SelectTrigger className="w-[180px] h-9" data-testid="select-tone-email">
                    <SelectValue placeholder="Reescrever Tom" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="professional">Profissional</SelectItem>
                    <SelectItem value="friendly">Amigável</SelectItem>
                    <SelectItem value="empathetic">Empático</SelectItem>
                    <SelectItem value="technical">Técnico</SelectItem>
                    <SelectItem value="concise">Conciso</SelectItem>
                  </SelectContent>
                </Select>

                {/* Translate */}
                <Select onValueChange={(lang) => {
                  const msg = form.getValues('message');
                  if (!msg || !msg.trim()) {
                    toast({ title: "Digite uma mensagem primeiro", variant: "destructive" });
                    return;
                  }
                  translateMutation.mutate(lang);
                }}>
                  <SelectTrigger className="w-[150px] h-9" data-testid="select-translate-email">
                    <SelectValue placeholder="Traduzir" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Portuguese">Português</SelectItem>
                    <SelectItem value="English">Inglês</SelectItem>
                    <SelectItem value="Spanish">Espanhol</SelectItem>
                    <SelectItem value="French">Francês</SelectItem>
                    <SelectItem value="German">Alemão</SelectItem>
                  </SelectContent>
                </Select>

                {/* Summarize */}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const msg = form.getValues('message');
                    if (!msg || !msg.trim()) {
                      toast({ title: "Digite uma mensagem primeiro", variant: "destructive" });
                      return;
                    }
                    summarizeMutation.mutate('short');
                  }}
                  disabled={summarizeMutation.isPending}
                  data-testid="button-summarize-email"
                >
                  {summarizeMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <FileText className="h-4 w-4 mr-2" />
                  )}
                  Resumir
                </Button>

                {/* Quick Reply */}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const msg = form.getValues('message');
                    if (!msg || !msg.trim()) {
                      toast({ title: "Digite uma mensagem primeiro", variant: "destructive" });
                      return;
                    }
                    quickReplyMutation.mutate();
                  }}
                  disabled={quickReplyMutation.isPending}
                  data-testid="button-quick-reply-email"
                >
                  {quickReplyMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4 mr-2" />
                  )}
                  Sugestão IA
                </Button>
              </div>
            </div>

            {/* Seção de Anexos */}
            <div className="space-y-3">
              <Label>Anexos</Label>
              
              {/* Área de Drop */}
              <div
                className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors ${
                  isDragActive 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <input
                  type="file"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                  id="file-upload"
                  accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif"
                />
                <label
                  htmlFor="file-upload"
                  className="cursor-pointer flex flex-col items-center space-y-2"
                >
                  <Upload className="w-8 h-8 text-gray-400" />
                  <span className="text-sm text-gray-600">
                    Clique para enviar arquivos ou arraste aqui
                  </span>
                  <span className="text-xs text-gray-400">
                    PDF, DOC, TXT, JPG, PNG (máx. 10MB cada)
                  </span>
                </label>
              </div>

              {/* Lista de Arquivos */}
              {attachments.length > 0 && (
                <div className="space-y-2">
                  {attachments.map((file, index) => (
                    <Card key={index} className="p-2">
                      <CardContent className="p-0">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Paperclip className="w-4 h-4 text-gray-400" />
                            <span className="text-sm truncate">{file.name}</span>
                            <span className="text-xs text-gray-400">
                              ({(file.size / 1024 / 1024).toFixed(2)} MB)
                            </span>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFile(index)}
                            data-testid={`button-remove-attachment-${index}`}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Botões de Ação */}
            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                data-testid="button-email-cancel"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={sendEmailMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700"
                data-testid="button-email-send"
              >
                {sendEmailMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Enviar Email
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}