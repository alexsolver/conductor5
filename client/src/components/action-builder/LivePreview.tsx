import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Bot, 
  User, 
  Send, 
  RotateCcw,
  Play,
  Sparkles,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { MappedField } from './FieldMapper';

// ========================================
// TYPES
// ========================================

interface Message {
  id: string;
  role: 'user' | 'agent' | 'system';
  content: string;
  timestamp: Date;
  fieldCollected?: string;
  collectionMethod?: 'conversational' | 'interactive';
  buttons?: string[];
}

interface LivePreviewProps {
  actionName: string;
  aiTone: 'professional' | 'friendly' | 'technical' | 'casual';
  aiStyle: 'concise' | 'detailed' | 'step_by_step';
  selectedFields: MappedField[];
  defaultCollectionStrategy: 'conversational' | 'interactive' | 'hybrid' | 'adaptive';
  successTemplate: string;
  errorTemplate: string;
}

// ========================================
// TONE CONFIGS
// ========================================

const TONE_GREETINGS = {
  professional: 'Olá! Sou seu assistente profissional. Como posso ajudá-lo?',
  friendly: 'Oi! 😊 Tudo bem? Como posso te ajudar hoje?',
  technical: 'Saudações. Sistema pronto para auxiliar. Qual a operação desejada?',
  casual: 'E aí! Bora lá, como posso dar uma força?'
};

const TONE_CONFIRMATIONS = {
  professional: 'Perfeito. Vou processar sua solicitação.',
  friendly: 'Ótimo! Vou cuidar disso para você agora 😄',
  technical: 'Confirmado. Iniciando processamento.',
  casual: 'Show! Vou mandar ver aqui!'
};

const FIELD_QUESTIONS = {
  title: 'Qual o título?',
  description: 'Descreva os detalhes:',
  priority: 'Qual a prioridade?',
  category: 'Selecione a categoria:',
  customerId: 'Quem é o cliente?',
  assignedTo: 'Quem deve ser o responsável?',
  dueDate: 'Qual a data de vencimento?',
  date: 'Para que data?',
  time: 'Que horas?',
  firstName: 'Qual o nome?',
  lastName: 'E o sobrenome?',
  email: 'Qual o email?',
  phone: 'Qual o telefone?'
};

// ========================================
// COMPONENT
// ========================================

export default function LivePreview({
  actionName,
  aiTone,
  aiStyle,
  selectedFields,
  defaultCollectionStrategy,
  successTemplate,
  errorTemplate
}: LivePreviewProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentFieldIndex, setCurrentFieldIndex] = useState(-1);
  const [userInput, setUserInput] = useState('');
  const [isSimulating, setIsSimulating] = useState(false);
  const [collectedData, setCollectedData] = useState<Record<string, string>>({});
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const addMessage = (message: Omit<Message, 'id' | 'timestamp'>) => {
    setMessages(prev => [...prev, {
      ...message,
      id: `msg-${Date.now()}-${Math.random()}`,
      timestamp: new Date()
    }]);
  };

  const startSimulation = () => {
    setMessages([]);
    setCurrentFieldIndex(-1);
    setCollectedData({});
    setIsSimulating(true);
    
    // Initial greeting
    setTimeout(() => {
      addMessage({
        role: 'agent',
        content: TONE_GREETINGS[aiTone]
      });
      
      setTimeout(() => {
        addMessage({
          role: 'user',
          content: `Quero ${actionName.toLowerCase()}`
        });
        
        setTimeout(() => {
          if (selectedFields.length > 0) {
            askNextField(0);
          } else {
            addMessage({
              role: 'agent',
              content: 'Ação não possui campos configurados ainda.'
            });
            setIsSimulating(false);
          }
        }, 800);
      }, 600);
    }, 500);
  };

  const askNextField = (index: number) => {
    if (index >= selectedFields.length) {
      // All fields collected - show confirmation
      setTimeout(() => {
        addMessage({
          role: 'agent',
          content: TONE_CONFIRMATIONS[aiTone]
        });
        
        setTimeout(() => {
          const formattedSuccess = successTemplate
            .replace(/\{(\w+)\}/g, (_, key) => collectedData[key] || `{${key}}`);
          
          addMessage({
            role: 'system',
            content: formattedSuccess
          });
          setIsSimulating(false);
        }, 1000);
      }, 800);
      return;
    }

    const field = selectedFields[index];
    setCurrentFieldIndex(index);
    
    const question = FIELD_QUESTIONS[field.key as keyof typeof FIELD_QUESTIONS] || `Informe ${field.label}:`;
    
    setTimeout(() => {
      // Determine collection method
      const method = field.collectionStrategy === 'hybrid' 
        ? defaultCollectionStrategy 
        : field.collectionStrategy;

      if (method === 'interactive' && field.type === 'select') {
        // Show buttons for select fields
        addMessage({
          role: 'agent',
          content: question,
          fieldCollected: field.key,
          collectionMethod: 'interactive',
          buttons: getFieldOptions(field.key)
        });
      } else {
        // Ask conversationally
        addMessage({
          role: 'agent',
          content: question,
          fieldCollected: field.key,
          collectionMethod: 'conversational'
        });
      }
    }, 600);
  };

  const getFieldOptions = (fieldKey: string): string[] => {
    const optionsMap: Record<string, string[]> = {
      priority: ['Baixa', 'Média', 'Alta', 'Crítica'],
      category: ['Suporte', 'Hardware', 'Software', 'Rede'],
      status: ['Novo', 'Em Andamento', 'Concluído']
    };
    return optionsMap[fieldKey] || ['Opção 1', 'Opção 2', 'Opção 3'];
  };

  const handleUserResponse = (value: string) => {
    if (!isSimulating || currentFieldIndex < 0) return;

    const field = selectedFields[currentFieldIndex];
    
    // Add user message
    addMessage({
      role: 'user',
      content: value
    });

    // Store collected data
    setCollectedData(prev => ({ ...prev, [field.key]: value }));
    setUserInput('');

    // Ask next field
    askNextField(currentFieldIndex + 1);
  };

  const handleButtonClick = (value: string) => {
    handleUserResponse(value);
  };

  const handleInputSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (userInput.trim()) {
      handleUserResponse(userInput);
    }
  };

  const resetSimulation = () => {
    setMessages([]);
    setCurrentFieldIndex(-1);
    setCollectedData({});
    setIsSimulating(false);
    setUserInput('');
  };

  return (
    <Card className="h-full flex flex-col" data-testid="live-preview">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2" data-testid="text-preview-title">
              <Sparkles className="w-4 h-4 text-purple-500" />
              Live Preview
            </CardTitle>
            <CardDescription className="text-xs" data-testid="text-preview-desc">
              Veja como será a conversa com o usuário
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={resetSimulation}
              disabled={messages.length === 0}
              data-testid="button-reset-preview"
            >
              <RotateCcw className="w-3 h-3 mr-1" />
              Resetar
            </Button>
            <Button
              size="sm"
              onClick={startSimulation}
              disabled={isSimulating || selectedFields.length === 0}
              data-testid="button-start-simulation"
            >
              <Play className="w-3 h-3 mr-1" />
              {isSimulating ? 'Simulando...' : 'Simular'}
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col min-h-0 p-0">
        {/* Messages Area */}
        <ScrollArea className="flex-1 px-4" ref={scrollRef as any}>
          <div className="space-y-3 py-4" data-testid="messages-container">
            {messages.length === 0 ? (
              <div className="text-center text-muted-foreground py-12" data-testid="text-no-messages">
                <Bot className="mx-auto w-12 h-12 mb-3 opacity-50" />
                <p>Clique em "Simular" para testar a conversa</p>
                {selectedFields.length === 0 && (
                  <p className="text-xs mt-2">Configure campos primeiro no Step 3</p>
                )}
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  data-testid={`message-${message.role}`}
                >
                  {message.role !== 'user' && (
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                      message.role === 'system' 
                        ? 'bg-green-100 dark:bg-green-900' 
                        : 'bg-purple-100 dark:bg-purple-900'
                    }`}>
                      {message.role === 'system' ? (
                        <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
                      ) : (
                        <Bot className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      )}
                    </div>
                  )}
                  
                  <div className={`flex-1 max-w-[80%] ${message.role === 'user' ? 'text-right' : ''}`}>
                    <div className={`inline-block rounded-lg px-4 py-2 ${
                      message.role === 'user'
                        ? 'bg-blue-500 text-white'
                        : message.role === 'system'
                        ? 'bg-green-500 text-white'
                        : 'bg-muted'
                    }`}>
                      <p className="text-sm" data-testid="text-message-content">{message.content}</p>
                    </div>
                    
                    {/* Interactive Buttons */}
                    {message.buttons && message.buttons.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {message.buttons.map((button, idx) => (
                          <Button
                            key={idx}
                            size="sm"
                            variant="outline"
                            onClick={() => handleButtonClick(button)}
                            disabled={!isSimulating || currentFieldIndex !== selectedFields.findIndex(f => f.key === message.fieldCollected)}
                            data-testid={`button-option-${idx}`}
                          >
                            {button}
                          </Button>
                        ))}
                      </div>
                    )}
                    
                    {message.collectionMethod && (
                      <div className="text-xs text-muted-foreground mt-1">
                        <Badge variant="outline" className="text-xs">
                          {message.collectionMethod === 'conversational' ? '💬 Conversacional' : '🎛️ Interativo'}
                        </Badge>
                      </div>
                    )}
                  </div>

                  {message.role === 'user' && (
                    <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center shrink-0">
                      <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        {/* Input Area */}
        {isSimulating && currentFieldIndex >= 0 && selectedFields[currentFieldIndex]?.collectionStrategy !== 'interactive' && (
          <div className="border-t p-4">
            <form onSubmit={handleInputSubmit} className="flex gap-2">
              <Input
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder="Digite sua resposta..."
                disabled={!isSimulating}
                data-testid="input-user-response"
              />
              <Button 
                type="submit" 
                size="sm"
                disabled={!userInput.trim()}
                data-testid="button-send-response"
              >
                <Send className="w-4 h-4" />
              </Button>
            </form>
          </div>
        )}

        {/* Debug Info */}
        {isSimulating && (
          <div className="border-t p-2 bg-muted/50">
            <div className="text-xs text-muted-foreground flex items-center gap-2">
              <AlertCircle className="w-3 h-3" />
              Campo {currentFieldIndex + 1}/{selectedFields.length}
              {currentFieldIndex >= 0 && selectedFields[currentFieldIndex] && (
                <span> - Coletando: <code className="bg-background px-1 rounded">{selectedFields[currentFieldIndex].label}</code></span>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
