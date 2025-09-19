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
  Mail, 
  Send,
  Paperclip,
  Upload,
  X,
  Plus,
  AlertCircle,
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
  }, [isOpen, form, ticketSubject]);

  // Mutation para enviar email
  const sendEmailMutation = useMutation({
    mutationFn: async (data: EmailFormData) => {
      console.log('🔧 [EMAIL-MODAL] Form data received:', data);
      
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

      console.log('🔧 [EMAIL-MODAL] FormData entries:');
      for (let [key, value] of formData.entries()) {
        console.log(`  ${key}:`, value);
      }

      const response = await apiRequest("POST", `/api/tickets/${ticketId}/send-email`, formData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Email enviado",
        description: "O email foi enviado com sucesso.",
      });
      
      // Invalidar cache das comunicações
      queryClient.invalidateQueries({
        queryKey: ["/api/tickets", ticketId, "communications"],
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