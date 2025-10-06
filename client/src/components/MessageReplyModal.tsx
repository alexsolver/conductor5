import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { 
  Wand2, Languages, FileText, MessageSquarePlus, 
  CheckCircle, Loader2 
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";

interface MessageReplyModalProps {
  open: boolean;
  onClose: () => void;
  originalMessage: {
    id: string;
    content: string;
    type: string;
    direction: string;
  };
  onSend: (message: string) => Promise<void>;
}

export function MessageReplyModal({ open, onClose, originalMessage, onSend }: MessageReplyModalProps) {
  const [message, setMessage] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  // Spell check mutation
  const spellCheckMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/message-ai/spell-check', { text: message });
      const data = await response.json();
      return data;
    },
    onSuccess: (data: any) => {
      
      // Só atualiza o texto se houver um texto corrigido válido
      if (data.correctedText && data.correctedText.trim()) {
        setMessage(data.correctedText);
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
      console.error('❌ [SPELL-CHECK-FRONTEND] Error in spell check');
      toast({
        title: "Erro",
        description: "Falha ao verificar ortografia",
        variant: "destructive",
      });
    },
  });

  // Rewrite mutation
  const rewriteMutation = useMutation({
    mutationFn: async (tone: string) => {
      const response = await apiRequest('POST', '/api/message-ai/rewrite', { text: message, tone });
      return await response.json();
    },
    onSuccess: (data: any) => {
      // Só atualiza o texto se houver um texto reescrito válido
      if (data.rewrittenText && data.rewrittenText.trim()) {
        setMessage(data.rewrittenText);
        toast({
          title: "Texto Reescrito",
          description: `Tom ${data.tone} aplicado com sucesso`,
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

  // Translate mutation
  const translateMutation = useMutation({
    mutationFn: async (targetLanguage: string) => {
      const response = await apiRequest('POST', '/api/message-ai/translate', { 
        text: message, 
        targetLanguage 
      });
      const data = await response.json();
      return data;
    },
    onSuccess: (data: any) => {
      // Só atualiza o texto se houver um texto traduzido válido
      if (data.translatedText && data.translatedText.trim()) {
        setMessage(data.translatedText);
        toast({
          title: "Texto Traduzido",
          description: `Traduzido para ${data.targetLanguage}`,
        });
      } else {
        toast({
          title: "Aviso",
          description: "Não foi possível traduzir o texto",
          variant: "destructive",
        });
      }
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Falha ao traduzir texto",
        variant: "destructive",
      });
    },
  });

  // Summarize mutation
  const summarizeMutation = useMutation({
    mutationFn: async (type: 'short' | 'expanded') => {
      const response = await apiRequest('POST', '/api/message-ai/summarize', { text: message, length: type === 'short' ? 'short' : 'long' });
      return await response.json();
    },
    onSuccess: (data: any) => {
      // Só atualiza o texto se houver um resumo válido
      if (data.summary && data.summary.trim()) {
        setMessage(data.summary);
        toast({
          title: data.type === 'short' ? "Texto Resumido" : "Texto Expandido",
          description: `Processamento ${data.type === 'short' ? 'resumo' : 'expansão'} concluído`,
        });
      } else {
        toast({
          title: "Aviso",
          description: "Não foi possível processar o texto",
          variant: "destructive",
        });
      }
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Falha ao processar texto",
        variant: "destructive",
      });
    },
  });

  // Quick replies mutation
  const quickRepliesMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/message-ai/quick-reply', { 
        text: originalMessage.content 
      });
      return await response.json();
    },
    onSuccess: (data: any) => {
      if (data.suggestions && data.suggestions.length > 0 && data.suggestions[0].trim()) {
        // Show first suggestion
        setMessage(data.suggestions[0]);
        toast({
          title: "Sugestão de Resposta",
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
        description: "Falha ao gerar respostas rápidas",
        variant: "destructive",
      });
    },
  });

  const handleSend = async () => {
    if (!message.trim()) {
      toast({
        title: "Erro",
        description: "Digite uma mensagem",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    try {
      await onSend(message);
      setMessage("");
      onClose();
      toast({
        title: "Mensagem Enviada",
        description: "Resposta enviada com sucesso",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao enviar mensagem",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Don't render if no original message
  if (!originalMessage) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Responder Mensagem</DialogTitle>
          <DialogDescription>
            Use as ferramentas de IA para melhorar sua resposta
          </DialogDescription>
        </DialogHeader>

        {/* Original Message */}
        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg mb-4">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Mensagem original:</p>
          <p className="text-gray-900 dark:text-gray-100">{originalMessage.content}</p>
        </div>

        {/* AI Tools */}
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {/* Spell Check */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (!message || !message.trim()) {
                  toast({ title: "Digite uma mensagem primeiro", variant: "destructive" });
                  return;
                }
                spellCheckMutation.mutate();
              }}
              disabled={spellCheckMutation.isPending}
              data-testid="button-spell-check"
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
              if (!message || !message.trim()) {
                toast({ title: "Digite uma mensagem primeiro", variant: "destructive" });
                return;
              }
              rewriteMutation.mutate(tone);
            }}>
              <SelectTrigger className="w-[180px]" data-testid="select-tone">
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
              if (!message || !message.trim()) {
                toast({ title: "Digite uma mensagem primeiro", variant: "destructive" });
                return;
              }
              translateMutation.mutate(lang);
            }}>
              <SelectTrigger className="w-[150px]" data-testid="select-translate">
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
              variant="outline"
              size="sm"
              onClick={() => {
                if (!message || !message.trim()) {
                  toast({ title: "Digite uma mensagem primeiro", variant: "destructive" });
                  return;
                }
                summarizeMutation.mutate('short');
              }}
              disabled={summarizeMutation.isPending}
              data-testid="button-summarize"
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
              variant="outline"
              size="sm"
              onClick={() => quickRepliesMutation.mutate()}
              disabled={quickRepliesMutation.isPending}
              data-testid="button-quick-reply"
            >
              {quickRepliesMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Wand2 className="h-4 w-4 mr-2" />
              )}
              Sugestão IA
            </Button>
          </div>

          {/* Message Textarea */}
          <Textarea
            placeholder="Digite sua resposta aqui..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={8}
            className="w-full"
            data-testid="textarea-reply-message"
          />

          {/* Action Buttons */}
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isProcessing}
              data-testid="button-cancel-reply"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSend}
              disabled={!message.trim() || isProcessing}
              data-testid="button-send-reply"
            >
              {isProcessing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <MessageSquarePlus className="h-4 w-4 mr-2" />
              )}
              Enviar Resposta
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
