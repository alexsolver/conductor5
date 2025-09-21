import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import {
  Play,
  Pause,
  RotateCcw,
  Send,
  Bot,
  User,
  MessageSquare,
  Mail,
  Phone,
  Smartphone,
  Clock,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Zap,
  Target,
  Bell,
  FileText,
  Tag,
  Archive,
  Forward,
  Reply,
  Settings,
  Eye,
  Lightbulb,
  Brain,
  Sparkles,
  MousePointer2,
  Activity,
  PlayCircle,
  StopCircle,
  RefreshCw,
  Monitor,
  Download,
  Upload,
  ExternalLink
} from 'lucide-react';

interface SimulatedMessage {
  id: string;
  type: 'incoming' | 'outgoing' | 'system';
  channel: 'email' | 'whatsapp' | 'telegram' | 'sms';
  from: string;
  to: string;
  content: string;
  timestamp: Date;
  triggered?: boolean;
  triggerReason?: string;
  actions?: Array<{
    type: string;
    description: string;
    result: string;
  }>;
}

interface SimulationStep {
  id: string;
  type: 'trigger' | 'action' | 'response';
  description: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  details: any;
  timestamp: Date;
}

interface LivePreviewProps {
  automationRule?: any;
  chatbotConfig?: any;
  onClose: () => void;
}

export default function LivePreview({ automationRule, chatbotConfig, onClose }: LivePreviewProps) {
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [isSimulating, setIsSimulating] = useState(false);
  const [simulatedMessages, setSimulatedMessages] = useState<SimulatedMessage[]>([]);
  const [simulationSteps, setSimulationSteps] = useState<SimulationStep[]>([]);
  const [testMessage, setTestMessage] = useState('');
  const [testChannel, setTestChannel] = useState<'email' | 'whatsapp' | 'telegram' | 'sms'>('whatsapp');
  const [currentChatbotStep, setCurrentChatbotStep] = useState<string>('');
  const [chatbotConversation, setChatbotConversation] = useState<Array<{
    type: 'bot' | 'user';
    message: string;
    timestamp: Date;
    options?: Array<{ text: string; value: string }>;
  }>>([]);

  // Test automation rule
  const testRuleMutation = useMutation({
    mutationFn: (data: { rule: any; message: string; channel: string }) =>
      apiRequest('POST', '/api/omnibridge/automation-rules/test', data),
    onSuccess: (response) => {
      simulateRuleExecution(response.data);
    },
    onError: () => {
      toast({ title: 'Erro', description: 'Falha ao testar regra', variant: 'destructive' });
    }
  });

  // Test chatbot
  const testChatbotMutation = useMutation({
    mutationFn: (data: { chatbot: any; message: string }) =>
      apiRequest('POST', '/api/omnibridge/chatbots/test', data),
    onSuccess: (response) => {
      simulateChatbotResponse(response.data);
    },
    onError: () => {
      toast({ title: 'Erro', description: 'Falha ao testar chatbot', variant: 'destructive' });
    }
  });

  useEffect(() => {
    if (chatbotConfig && chatbotConfig.greeting) {
      initializeChatbot();
    }
  }, [chatbotConfig]);

  useEffect(() => {
    scrollToBottom();
  }, [simulatedMessages, chatbotConversation]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const initializeChatbot = () => {
    setChatbotConversation([{
      type: 'bot',
      message: chatbotConfig.greeting || 'Olá! Como posso ajudar você?',
      timestamp: new Date()
    }]);
    
    // Find first step
    const firstStep = chatbotConfig.steps?.[0];
    if (firstStep) {
      setCurrentChatbotStep(firstStep.id);
      if (firstStep.type === 'options') {
        setTimeout(() => {
          setChatbotConversation(prev => [...prev, {
            type: 'bot',
            message: firstStep.content,
            timestamp: new Date(),
            options: firstStep.options?.map((opt: any) => ({
              text: opt.text,
              value: opt.id
            }))
          }]);
        }, 1000);
      }
    }
  };

  const simulateRuleExecution = (testResult: any) => {
    setIsSimulating(true);
    
    // Add the incoming message
    const incomingMessage: SimulatedMessage = {
      id: `msg_${Date.now()}`,
      type: 'incoming',
      channel: testChannel,
      from: 'cliente@exemplo.com',
      to: 'suporte@empresa.com',
      content: testMessage,
      timestamp: new Date(),
      triggered: testResult.triggered,
      triggerReason: testResult.triggerReason
    };

    setSimulatedMessages([incomingMessage]);
    setSimulationSteps([]);

    // Simulate step by step execution
    if (testResult.triggered && testResult.actions) {
      let stepDelay = 1000;
      
      testResult.actions.forEach((action: any, index: number) => {
        setTimeout(() => {
          // Add simulation step
          const step: SimulationStep = {
            id: `step_${index}`,
            type: 'action',
            description: action.description,
            status: 'running',
            details: action,
            timestamp: new Date()
          };
          
          setSimulationSteps(prev => [...prev, step]);
          
          // Complete step after delay
          setTimeout(() => {
            setSimulationSteps(prev => 
              prev.map(s => s.id === step.id ? { ...s, status: 'completed' } : s)
            );
            
            // If it's an auto-reply, add response message
            if (action.type === 'auto_reply') {
              const responseMessage: SimulatedMessage = {
                id: `response_${Date.now()}`,
                type: 'outgoing',
                channel: testChannel,
                from: 'suporte@empresa.com',
                to: 'cliente@exemplo.com',
                content: action.config.message || action.result,
                timestamp: new Date()
              };
              
              setSimulatedMessages(prev => [...prev, responseMessage]);
            }
            
            // Add system message for other actions
            if (action.type !== 'auto_reply') {
              const systemMessage: SimulatedMessage = {
                id: `system_${Date.now()}`,
                type: 'system',
                channel: testChannel,
                from: 'Sistema',
                to: '',
                content: `✅ ${action.description}: ${action.result}`,
                timestamp: new Date()
              };
              
              setSimulatedMessages(prev => [...prev, systemMessage]);
            }
          }, 1500);
        }, stepDelay);
        
        stepDelay += 2500;
      });
      
      // Finish simulation
      setTimeout(() => {
        setIsSimulating(false);
      }, stepDelay + 1000);
    } else {
      // No trigger
      setTimeout(() => {
        const systemMessage: SimulatedMessage = {
          id: `system_no_trigger`,
          type: 'system',
          channel: testChannel,
          from: 'Sistema',
          to: '',
          content: '❌ Esta mensagem não ativou nenhuma regra de automação.',
          timestamp: new Date()
        };
        
        setSimulatedMessages(prev => [...prev, systemMessage]);
        setIsSimulating(false);
      }, 1000);
    }
  };

  const simulateChatbotResponse = (testResult: any) => {
    // Add user message
    setChatbotConversation(prev => [...prev, {
      type: 'user',
      message: testMessage,
      timestamp: new Date()
    }]);

    // Simulate bot response delay
    setTimeout(() => {
      setChatbotConversation(prev => [...prev, {
        type: 'bot',
        message: testResult.response || 'Desculpe, não entendi.',
        timestamp: new Date()
      }]);

      // If there are next steps/options, show them
      if (testResult.nextStep) {
        const nextStep = chatbotConfig.steps?.find((s: any) => s.id === testResult.nextStep);
        if (nextStep) {
          setCurrentChatbotStep(nextStep.id);
          if (nextStep.type === 'options') {
            setTimeout(() => {
              setChatbotConversation(prev => [...prev, {
                type: 'bot',
                message: nextStep.content,
                timestamp: new Date(),
                options: nextStep.options?.map((opt: any) => ({
                  text: opt.text,
                  value: opt.id
                }))
              }]);
            }, 1000);
          }
        }
      }
    }, 1500);
  };

  const handleTestRule = () => {
    if (!testMessage.trim()) {
      toast({ title: 'Erro', description: 'Digite uma mensagem para testar', variant: 'destructive' });
      return;
    }

    testRuleMutation.mutate({
      rule: automationRule,
      message: testMessage,
      channel: testChannel
    });
  };

  const handleTestChatbot = () => {
    if (!testMessage.trim()) {
      toast({ title: 'Erro', description: 'Digite uma mensagem para testar', variant: 'destructive' });
      return;
    }

    testChatbotMutation.mutate({
      chatbot: chatbotConfig,
      message: testMessage
    });
    
    setTestMessage('');
  };

  const handleChatbotOptionClick = (option: { text: string; value: string }) => {
    setChatbotConversation(prev => [...prev, {
      type: 'user',
      message: option.text,
      timestamp: new Date()
    }]);

    // Find the option in current step and follow its nextStep
    const currentStep = chatbotConfig.steps?.find((s: any) => s.id === currentChatbotStep);
    const selectedOption = currentStep?.options?.find((opt: any) => opt.id === option.value);
    
    if (selectedOption?.nextStep) {
      const nextStep = chatbotConfig.steps?.find((s: any) => s.id === selectedOption.nextStep);
      if (nextStep) {
        setTimeout(() => {
          setChatbotConversation(prev => [...prev, {
            type: 'bot',
            message: nextStep.content,
            timestamp: new Date(),
            ...(nextStep.type === 'options' && {
              options: nextStep.options?.map((opt: any) => ({
                text: opt.text,
                value: opt.id
              }))
            })
          }]);
          setCurrentChatbotStep(nextStep.id);
        }, 1000);
      }
    }
  };

  const resetSimulation = () => {
    setSimulatedMessages([]);
    setSimulationSteps([]);
    setChatbotConversation([]);
    setIsSimulating(false);
    setTestMessage('');
    
    if (chatbotConfig) {
      initializeChatbot();
    }
  };

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'email': return Mail;
      case 'whatsapp': return MessageSquare;
      case 'telegram': return Send;
      case 'sms': return Phone;
      default: return MessageSquare;
    }
  };

  const getChannelColor = (channel: string) => {
    switch (channel) {
      case 'email': return 'text-blue-600';
      case 'whatsapp': return 'text-green-600';
      case 'telegram': return 'text-sky-600';
      case 'sms': return 'text-purple-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-6xl h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500 rounded-lg text-white">
                <Monitor className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Preview em Tempo Real
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {automationRule ? 'Teste sua regra de automação' : 'Teste seu chatbot'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={resetSimulation}
                disabled={isSimulating}
                data-testid="reset-simulation"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Reiniciar
              </Button>
              <Button
                variant="outline"
                onClick={onClose}
                data-testid="close-preview"
              >
                Fechar
              </Button>
            </div>
          </div>
        </div>

        <div className="flex h-[calc(100%-80px)]">
          {/* Left Panel - Test Controls */}
          <div className="w-80 border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-4">
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-3">
                  Simular Mensagem
                </h3>
                
                {automationRule && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Canal
                      </label>
                      <Select value={testChannel} onValueChange={(value: any) => setTestChannel(value)}>
                        <SelectTrigger data-testid="test-channel">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="whatsapp">WhatsApp</SelectItem>
                          <SelectItem value="email">Email</SelectItem>
                          <SelectItem value="telegram">Telegram</SelectItem>
                          <SelectItem value="sms">SMS</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Mensagem de Teste
                  </label>
                  <Textarea
                    placeholder={automationRule ? 
                      "ex: Meu sistema parou de funcionar, é urgente!" :
                      "ex: Olá, preciso de ajuda"
                    }
                    value={testMessage}
                    onChange={(e) => setTestMessage(e.target.value)}
                    rows={3}
                    data-testid="test-message"
                  />
                </div>

                <Button
                  onClick={automationRule ? handleTestRule : handleTestChatbot}
                  disabled={isSimulating || testRuleMutation.isPending || testChatbotMutation.isPending}
                  className="w-full"
                  data-testid="test-button"
                >
                  {isSimulating ? (
                    <>
                      <Activity className="h-4 w-4 mr-2 animate-spin" />
                      Simulando...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      {automationRule ? 'Testar Regra' : 'Enviar Mensagem'}
                    </>
                  )}
                </Button>
              </div>

              <Separator />

              {/* Rule/Chatbot Info */}
              <div>
                <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                  {automationRule ? 'Regra Configurada' : 'Chatbot Configurado'}
                </h4>
                
                {automationRule && (
                  <div className="space-y-2">
                    <div className="text-sm">
                      <span className="font-medium text-gray-700 dark:text-gray-300">Nome:</span>
                      <p className="text-gray-600 dark:text-gray-400">{automationRule.name}</p>
                    </div>
                    <div className="text-sm">
                      <span className="font-medium text-gray-700 dark:text-gray-300">Gatilhos:</span>
                      <div className="space-y-1 mt-1">
                        {automationRule.triggers?.map((trigger: any, index: number) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {trigger.name || trigger.type}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="text-sm">
                      <span className="font-medium text-gray-700 dark:text-gray-300">Ações:</span>
                      <div className="space-y-1 mt-1">
                        {automationRule.actions?.map((action: any, index: number) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {action.name || action.type}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {chatbotConfig && (
                  <div className="space-y-2">
                    <div className="text-sm">
                      <span className="font-medium text-gray-700 dark:text-gray-300">Nome:</span>
                      <p className="text-gray-600 dark:text-gray-400">{chatbotConfig.name}</p>
                    </div>
                    <div className="text-sm">
                      <span className="font-medium text-gray-700 dark:text-gray-300">Passos:</span>
                      <p className="text-gray-600 dark:text-gray-400">{chatbotConfig.steps?.length || 0} configurados</p>
                    </div>
                    <div className="text-sm">
                      <span className="font-medium text-gray-700 dark:text-gray-300">Canais:</span>
                      <div className="flex gap-1 mt-1">
                        {chatbotConfig.channels?.map((channel: string) => (
                          <Badge key={channel} variant="outline" className="text-xs">
                            {channel}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Simulation Status */}
              {(simulationSteps.length > 0 || isSimulating) && (
                <>
                  <Separator />
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                      Status da Simulação
                    </h4>
                    <div className="space-y-2">
                      {simulationSteps.map((step) => (
                        <div key={step.id} className="flex items-center gap-2 text-sm">
                          {step.status === 'completed' ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : step.status === 'running' ? (
                            <Activity className="h-4 w-4 text-blue-500 animate-spin" />
                          ) : step.status === 'error' ? (
                            <AlertCircle className="h-4 w-4 text-red-500" />
                          ) : (
                            <Clock className="h-4 w-4 text-gray-400" />
                          )}
                          <span className="text-gray-700 dark:text-gray-300">
                            {step.description}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Right Panel - Preview */}
          <div className="flex-1 flex flex-col">
            {/* Preview Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                  {automationRule ? (
                    <Zap className="h-4 w-4 text-purple-600" />
                  ) : (
                    <Bot className="h-4 w-4 text-blue-600" />
                  )}
                </div>
                <h3 className="font-medium text-gray-900 dark:text-gray-100">
                  {automationRule ? 'Simulação de Automação' : 'Conversa com Chatbot'}
                </h3>
              </div>
            </div>

            {/* Messages Area */}
            <ScrollArea className="flex-1 p-4">
              {automationRule ? (
                /* Automation Rule Preview */
                <div className="space-y-3">
                  {simulatedMessages.length === 0 ? (
                    <div className="text-center py-12">
                      <PlayCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                        Pronto para testar!
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                        Digite uma mensagem no painel esquerdo e clique em "Testar Regra" 
                        para ver como sua automação funcionará.
                      </p>
                    </div>
                  ) : (
                    simulatedMessages.map((message) => {
                      const ChannelIcon = getChannelIcon(message.channel);
                      const channelColor = getChannelColor(message.channel);
                      
                      return (
                        <div
                          key={message.id}
                          className={`flex ${message.type === 'incoming' ? 'justify-start' : 
                            message.type === 'outgoing' ? 'justify-end' : 'justify-center'}`}
                        >
                          <div className={`max-w-xs lg:max-w-md ${
                            message.type === 'incoming' ? 'bg-gray-100 dark:bg-gray-700' :
                            message.type === 'outgoing' ? 'bg-blue-500 text-white' :
                            'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200'
                          } rounded-lg p-3`}>
                            {message.type !== 'system' && (
                              <div className="flex items-center gap-2 mb-2">
                                <ChannelIcon className={`h-4 w-4 ${channelColor}`} />
                                <span className="text-xs font-medium">
                                  {message.from}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {message.timestamp.toLocaleTimeString()}
                                </span>
                              </div>
                            )}
                            <p className="text-sm">{message.content}</p>
                            {message.triggered && (
                              <div className="mt-2 p-2 bg-green-100 dark:bg-green-900/20 rounded text-xs">
                                <span className="text-green-800 dark:text-green-200">
                                  ✅ Regra ativada: {message.triggerReason}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>
              ) : (
                /* Chatbot Preview */
                <div className="space-y-3">
                  {chatbotConversation.length === 0 ? (
                    <div className="text-center py-12">
                      <Bot className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                        Iniciando conversa...
                      </h3>
                    </div>
                  ) : (
                    chatbotConversation.map((msg, index) => (
                      <div
                        key={index}
                        className={`flex ${msg.type === 'bot' ? 'justify-start' : 'justify-end'}`}
                      >
                        <div className="max-w-xs lg:max-w-md space-y-2">
                          <div className={`${
                            msg.type === 'bot'
                              ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                              : 'bg-blue-500 text-white'
                          } rounded-lg p-3`}>
                            {msg.type === 'bot' && (
                              <div className="flex items-center gap-2 mb-2">
                                <Bot className="h-4 w-4 text-blue-600" />
                                <span className="text-xs font-medium">
                                  {chatbotConfig?.name || 'Chatbot'}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {msg.timestamp.toLocaleTimeString()}
                                </span>
                              </div>
                            )}
                            <p className="text-sm">{msg.message}</p>
                          </div>
                          
                          {/* Chatbot Options */}
                          {msg.options && (
                            <div className="space-y-1">
                              {msg.options.map((option, optIndex) => (
                                <Button
                                  key={optIndex}
                                  size="sm"
                                  variant="outline"
                                  className="w-full justify-start text-xs h-8"
                                  onClick={() => handleChatbotOptionClick(option)}
                                  data-testid={`chatbot-option-${optIndex}`}
                                >
                                  {option.text}
                                </Button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </ScrollArea>

            {/* Chat Input for Chatbot */}
            {chatbotConfig && (
              <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                <div className="flex gap-2">
                  <Input
                    placeholder="Digite sua mensagem..."
                    value={testMessage}
                    onChange={(e) => setTestMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleTestChatbot()}
                    data-testid="chatbot-input"
                  />
                  <Button
                    onClick={handleTestChatbot}
                    disabled={!testMessage.trim() || testChatbotMutation.isPending}
                    data-testid="send-chatbot-message"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}