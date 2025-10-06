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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { 
  MessageCircle, 
  Send,
  Phone,
  Upload,
  X,
  Image,
  FileText,
  AlertCircle,
  Wand2,
  Languages,
  Sparkles,
  MessageSquarePlus,
  CheckCircle,
  Loader2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

// Schema de validação para mensagens
const messagingSchema = z.object({
  channel: z.enum(["whatsapp", "telegram", "sms"], {
    required_error: "Selecione um canal de comunicação",
  }),
  recipient: z.string().min(1, "Destinatário é obrigatório"),
  message: z.string().min(1, "Mensagem é obrigatória").max(4000, "Mensagem muito longa"),
  media: z.array(z.any()).optional(),
});

type MessagingFormData = z.infer<typeof messagingSchema>;

interface MessagingModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticketId: string;
  ticketNumber?: string;
}

const channelConfig = {
  whatsapp: {
    name: "WhatsApp",
    icon: MessageCircle,
    placeholder: "+55 11 99999-9999",
    color: "text-green-600",
    bgColor: "bg-green-50",
    borderColor: "border-green-200",
  },
  telegram: {
    name: "Telegram",
    icon: Send,
    placeholder: "@usuario ou ID",
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
  },
  sms: {
    name: "SMS",
    icon: Phone,
    placeholder: "+55 11 99999-9999",
    color: "text-purple-600",
    bgColor: "bg-purple-50",
    borderColor: "border-purple-200",
  },
};

export default function MessagingModal({ isOpen, onClose, ticketId, ticketNumber }: MessagingModalProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [isDragActive, setIsDragActive] = useState(false);

  const form = useForm<MessagingFormData>({
    resolver: zodResolver(messagingSchema),
    defaultValues: {
      channel: "whatsapp",
      recipient: "",
      message: "",
      media: [],
    },
  });

  const selectedChannel = form.watch("channel");
  const config = channelConfig[selectedChannel];

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      form.reset({
        channel: "whatsapp",
        recipient: "",
        message: "",
        media: [],
      });
      setMediaFiles([]);
    }
  }, [isOpen, form]);

  // Mutation para enviar mensagem
  const sendMessageMutation = useMutation({
    mutationFn: async (data: MessagingFormData) => {
      const formData = new FormData();
      formData.append('ticketId', ticketId);
      formData.append('channel', data.channel);
      formData.append('recipient', data.recipient);
      formData.append('message', data.message);
      
      // Adicionar mídia
      mediaFiles.forEach((file, index) => {
        formData.append(`media`, file);
      });

      const response = await apiRequest("POST", `/api/tickets/${ticketId}/send-message`, formData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Mensagem enviada",
        description: `Mensagem enviada via ${config.name} com sucesso.`,
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
      console.error("Erro ao enviar mensagem:", error);
      toast({
        title: "Erro ao enviar mensagem",
        description: error.message || "Ocorreu um erro ao enviar a mensagem.",
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
        form.setValue('message', data.correctedText);
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
        form.setValue('message', data.rewrittenText);
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
      console.log('🔍 [TRANSLATE-DEBUG] Input text:', currentMessage);
      console.log('🔍 [TRANSLATE-DEBUG] Target language:', targetLanguage);
      const response = await apiRequest('POST', '/api/message-ai/translate', { text: currentMessage, targetLanguage });
      console.log('🔍 [TRANSLATE-DEBUG] Raw response:', response);
      const data = await response.json();
      console.log('🔍 [TRANSLATE-DEBUG] Parsed data:', data);
      return data;
    },
    onSuccess: (data: any) => {
      console.log('🔍 [TRANSLATE-DEBUG] onSuccess data:', data);
      // Só atualiza o texto se houver um texto traduzido válido
      if (data.translatedText && data.translatedText.trim()) {
        form.setValue('message', data.translatedText);
        toast({
          title: "Texto Traduzido",
          description: `Mensagem traduzida para ${data.targetLanguage}`,
        });
      } else {
        console.log('❌ [TRANSLATE-DEBUG] Validation failed:', data);
        toast({
          title: "Aviso",
          description: "Não foi possível traduzir o texto",
          variant: "destructive",
        });
      }
    },
    onError: (error) => {
      console.error('❌ [TRANSLATE-DEBUG] Error:', error);
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
      console.log('🔍 [SUMMARIZE-DEBUG] Input text:', currentMessage);
      console.log('🔍 [SUMMARIZE-DEBUG] Length:', length);
      const response = await apiRequest('POST', '/api/message-ai/summarize', { text: currentMessage, length });
      console.log('🔍 [SUMMARIZE-DEBUG] Raw response:', response);
      const data = await response.json();
      console.log('🔍 [SUMMARIZE-DEBUG] Parsed data:', data);
      return data;
    },
    onSuccess: (data: any) => {
      console.log('🔍 [SUMMARIZE-DEBUG] onSuccess data:', data);
      // Só atualiza o texto se houver um resumo válido
      if (data.summary && data.summary.trim()) {
        form.setValue('message', data.summary);
        toast({
          title: "Texto Resumido",
          description: "Mensagem resumida com sucesso",
        });
      } else {
        console.log('❌ [SUMMARIZE-DEBUG] Validation failed:', data);
        toast({
          title: "Aviso",
          description: "Não foi possível resumir o texto",
          variant: "destructive",
        });
      }
    },
    onError: (error) => {
      console.error('❌ [SUMMARIZE-DEBUG] Error:', error);
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
      console.log('🔍 [QUICK-REPLY-DEBUG] Input text:', currentMessage);
      const response = await apiRequest('POST', '/api/message-ai/quick-reply', { text: currentMessage });
      console.log('🔍 [QUICK-REPLY-DEBUG] Raw response:', response);
      const data = await response.json();
      console.log('🔍 [QUICK-REPLY-DEBUG] Parsed data:', data);
      return data;
    },
    onSuccess: (data: any) => {
      console.log('🔍 [QUICK-REPLY-DEBUG] onSuccess data:', data);
      if (data.suggestions && data.suggestions.length > 0 && data.suggestions[0].trim()) {
        form.setValue('message', data.suggestions[0]);
        toast({
          title: "Sugestão Aplicada",
          description: "Resposta rápida gerada com IA",
        });
      } else {
        console.log('❌ [QUICK-REPLY-DEBUG] Validation failed:', data);
        toast({
          title: "Aviso",
          description: "Não foi possível gerar uma sugestão",
          variant: "destructive",
        });
      }
    },
    onError: (error) => {
      console.error('❌ [QUICK-REPLY-DEBUG] Error:', error);
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
    // Filtrar apenas tipos de mídia suportados
    const validFiles = files.filter(file => 
      file.type.startsWith('image/') || 
      file.type.startsWith('video/') ||
      file.type.startsWith('audio/') ||
      file.type === 'application/pdf'
    );
    
    if (validFiles.length !== files.length) {
      toast({
        title: "Alguns arquivos não são suportados",
        description: "Apenas imagens, vídeos, áudios e PDFs são permitidos.",
        variant: "destructive",
      });
    }
    
    setMediaFiles(prev => [...prev, ...validFiles]);
  };

  // Handle file removal
  const removeFile = (index: number) => {
    setMediaFiles(prev => prev.filter((_, i) => i !== index));
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
    const validFiles = files.filter(file => 
      file.type.startsWith('image/') || 
      file.type.startsWith('video/') ||
      file.type.startsWith('audio/') ||
      file.type === 'application/pdf'
    );
    
    setMediaFiles(prev => [...prev, ...validFiles]);
  };

  const onSubmit = (data: MessagingFormData) => {
    sendMessageMutation.mutate(data);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) return Image;
    if (file.type.startsWith('video/')) return FileText;
    if (file.type.startsWith('audio/')) return FileText;
    return FileText;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="modal-messaging">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <config.icon className={`w-5 h-5 ${config.color}`} />
            {t('tickets.sendMessage')}
          </DialogTitle>
          <DialogDescription>
            Envie uma mensagem relacionada ao ticket #{ticketNumber || ticketId}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Seleção do Canal */}
            <FormField
              control={form.control}
              name="channel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Canal de Comunicação *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-messaging-channel">
                        <SelectValue placeholder="Selecione um canal" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="whatsapp">
                        <div className="flex items-center gap-2">
                          <MessageCircle className="w-4 h-4 text-green-600" />
                          WhatsApp
                        </div>
                      </SelectItem>
                      <SelectItem value="telegram">
                        <div className="flex items-center gap-2">
                          <Send className="w-4 h-4 text-blue-600" />
                          Telegram
                        </div>
                      </SelectItem>
                      <SelectItem value="sms">
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-purple-600" />
                          SMS
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Campo Destinatário */}
            <FormField
              control={form.control}
              name="recipient"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Destinatário *</FormLabel>
                  <FormControl>
                    <div className={`relative rounded-md border ${config.borderColor} ${config.bgColor}`}>
                      <config.icon className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${config.color}`} />
                      <Input
                        {...field}
                        placeholder={config.placeholder}
                        className="pl-10 bg-transparent border-0 focus:ring-0"
                        data-testid="input-messaging-recipient"
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                  <div className="text-xs text-gray-500">
                    {selectedChannel === 'whatsapp' && "Formato: +55 11 99999-9999 (com código do país)"}
                    {selectedChannel === 'telegram' && "Formato: @usuario ou ID numérico"}
                    {selectedChannel === 'sms' && "Formato: +55 11 99999-9999 (com código do país)"}
                  </div>
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
                      placeholder={`Digite sua mensagem para ${config.name}...`}
                      rows={5}
                      className="resize-none"
                      data-testid="textarea-messaging-message"
                    />
                  </FormControl>
                  <FormMessage />
                  <div className="text-xs text-gray-500 text-right">
                    {field.value?.length || 0}/4000 caracteres
                  </div>
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
                  onClick={() => spellCheckMutation.mutate()}
                  disabled={!form.watch('message') || spellCheckMutation.isPending}
                  data-testid="button-spell-check-messaging"
                >
                  {spellCheckMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <CheckCircle className="h-4 w-4 mr-2" />
                  )}
                  Corrigir Ortografia
                </Button>

                {/* Rewrite Tone */}
                <Select onValueChange={(tone) => rewriteMutation.mutate(tone)}>
                  <SelectTrigger className="w-[180px] h-9" data-testid="select-tone-messaging">
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
                <Select onValueChange={(lang) => translateMutation.mutate(lang)}>
                  <SelectTrigger className="w-[150px] h-9" data-testid="select-translate-messaging">
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
                  onClick={() => summarizeMutation.mutate('short')}
                  disabled={!form.watch('message') || summarizeMutation.isPending}
                  data-testid="button-summarize-messaging"
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
                  onClick={() => quickReplyMutation.mutate()}
                  disabled={quickReplyMutation.isPending}
                  data-testid="button-quick-reply-messaging"
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

            {/* Seção de Mídia (apenas para WhatsApp e Telegram) */}
            {selectedChannel !== 'sms' && (
              <div className="space-y-3">
                <Label>Mídia (opcional)</Label>
                
                {/* Área de Drop */}
                <div
                  className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors ${
                    isDragActive 
                      ? `border-${selectedChannel === 'whatsapp' ? 'green' : 'blue'}-500 bg-${selectedChannel === 'whatsapp' ? 'green' : 'blue'}-50` 
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
                    id="media-upload"
                    accept="image/*,video/*,audio/*,.pdf"
                  />
                  <label
                    htmlFor="media-upload"
                    className="cursor-pointer flex flex-col items-center space-y-2"
                  >
                    <Upload className="w-8 h-8 text-gray-400" />
                    <span className="text-sm text-gray-600">
                      Clique para enviar mídia ou arraste aqui
                    </span>
                    <span className="text-xs text-gray-400">
                      Imagens, vídeos, áudios e PDFs (máx. 16MB cada)
                    </span>
                  </label>
                </div>

                {/* Lista de Arquivos */}
                {mediaFiles.length > 0 && (
                  <div className="space-y-2">
                    {mediaFiles.map((file, index) => {
                      const FileIcon = getFileIcon(file);
                      return (
                        <Card key={index} className="p-2">
                          <CardContent className="p-0">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <FileIcon className="w-4 h-4 text-gray-400" />
                                <span className="text-sm truncate">{file.name}</span>
                                <span className="text-xs text-gray-400">
                                  ({formatFileSize(file.size)})
                                </span>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeFile(index)}
                                data-testid={`button-remove-media-${index}`}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Botões de Ação */}
            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                data-testid="button-messaging-cancel"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={sendMessageMutation.isPending}
                className={`${
                  selectedChannel === 'whatsapp' ? 'bg-green-600 hover:bg-green-700' :
                  selectedChannel === 'telegram' ? 'bg-blue-600 hover:bg-blue-700' :
                  'bg-purple-600 hover:bg-purple-700'
                }`}
                data-testid="button-messaging-send"
              >
                {sendMessageMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <config.icon className="w-4 h-4 mr-2" />
                    Enviar via {config.name}
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