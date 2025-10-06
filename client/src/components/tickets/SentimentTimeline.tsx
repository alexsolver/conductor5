import { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { User, UserCheck } from 'lucide-react';

interface Message {
  id: string;
  status: string;
  created_at: string;
  timestamp?: string;
  metadata?: {
    sentiment?: 'positive' | 'negative' | 'neutral';
    sentimentScore?: number;
  };
}

interface SentimentTimelineProps {
  messages: Message[];
}

export function SentimentTimeline({ messages }: SentimentTimelineProps) {
  const sortedMessages = useMemo(() => {
    return [...messages]
      .filter(m => m.metadata?.sentiment)
      .sort((a, b) => {
        const dateA = new Date(a.timestamp || a.created_at || 0).getTime();
        const dateB = new Date(b.timestamp || b.created_at || 0).getTime();
        return dateA - dateB;
      });
  }, [messages]);

  const agentMessages = sortedMessages.filter(m => m.status === 'sent');
  const userMessages = sortedMessages.filter(m => m.status === 'received');

  console.log('🔍 [SentimentTimeline] Messages received:', messages.length);
  console.log('🔍 [SentimentTimeline] With sentiment:', sortedMessages.length);
  console.log('🔍 [SentimentTimeline] Agent messages:', agentMessages.length, agentMessages.map(m => ({id: m.id, status: m.status, sentiment: m.metadata?.sentiment})));
  console.log('🔍 [SentimentTimeline] User messages:', userMessages.length);

  const getSentimentColor = (sentiment?: string, score?: number) => {
    if (!sentiment) return 'bg-gray-300';
    
    if (sentiment === 'positive') return 'bg-green-500';
    if (sentiment === 'negative') return 'bg-red-500';
    return 'bg-yellow-500';
  };

  const getSentimentIntensity = (score?: number) => {
    if (score === undefined) return 'opacity-70';
    const absScore = Math.abs(score);
    if (absScore >= 0.7) return 'opacity-100';
    if (absScore >= 0.4) return 'opacity-75';
    return 'opacity-50';
  };

  const [hoveredSegment, setHoveredSegment] = useState<string | null>(null);

  const renderTimelineTrack = (
    trackMessages: Message[], 
    label: string, 
    icon: React.ReactNode,
    bgColor: string
  ) => {
    if (trackMessages.length === 0) {
      return (
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            {icon}
            <span className="text-xs font-medium text-gray-500">{label}</span>
          </div>
          <div className="h-3 bg-gray-100 rounded-full"></div>
        </div>
      );
    }

    return (
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-2">
          {icon}
          <span className="text-xs font-medium text-gray-700">{label}</span>
          <Badge variant="secondary" className="text-xs">
            {trackMessages.length}
          </Badge>
        </div>
        <div className="relative">
          <div className="relative h-4 bg-gray-100 rounded-full overflow-hidden">
            <div className="absolute inset-0 flex">
              {trackMessages.map((msg, index) => {
                const widthPercent = 100 / trackMessages.length;
                const sentiment = msg.metadata?.sentiment;
                const score = msg.metadata?.sentimentScore;
                const color = getSentimentColor(sentiment, score);
                const intensity = getSentimentIntensity(score);

                return (
                  <div
                    key={msg.id}
                    className={`${color} ${intensity} transition-all hover:scale-y-125 hover:opacity-100 cursor-pointer border-r border-white relative group`}
                    style={{
                      width: `${widthPercent}%`,
                    }}
                    onMouseEnter={() => setHoveredSegment(msg.id)}
                    onMouseLeave={() => setHoveredSegment(null)}
                    data-testid={`timeline-segment-${msg.id}`}
                  >
                    {hoveredSegment === msg.id && (
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 z-10 bg-gray-900 text-white text-xs rounded-lg p-2 shadow-lg whitespace-nowrap">
                        <div className="space-y-1">
                          <p className="font-medium">Mensagem #{index + 1}</p>
                          <p>Sentimento: <strong className="capitalize">{sentiment}</strong></p>
                          {score !== undefined && (
                            <p>Score: <strong>{score.toFixed(2)}</strong></p>
                          )}
                          <p className="text-gray-300 text-[10px]">
                            {new Date(msg.created_at || msg.timestamp || '').toLocaleString('pt-BR', {
                              day: '2-digit',
                              month: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full bg-white border border-gray-200 rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-700">
          📊 Temperatura do Sentimento ao Longo da Conversa
        </h3>
        {sortedMessages.length > 0 && (
          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="text-gray-600">Positivo</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <span className="text-gray-600">Neutro</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <span className="text-gray-600">Negativo</span>
            </div>
          </div>
        )}
      </div>

      {sortedMessages.length === 0 ? (
        <div className="text-center py-6 text-gray-500">
          <div className="flex flex-col items-center gap-3">
            <div>
              <p className="font-medium mb-1">Análise de Sentimento Indisponível</p>
              <p className="text-xs text-gray-400">
                As mensagens ainda não foram analisadas. Configure a IA nas configurações do OmniBridge para habilitar análise automática.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {renderTimelineTrack(
              agentMessages,
              'Agente',
              <UserCheck className="h-4 w-4 text-blue-600" />,
              'bg-blue-50'
            )}
            
            <div className="border-t border-gray-200"></div>

            {renderTimelineTrack(
              userMessages,
              'Usuário',
              <User className="h-4 w-4 text-purple-600" />,
              'bg-purple-50'
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-gray-200">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>Total de mensagens: {sortedMessages.length}</span>
              <span>
                Agente: {agentMessages.length} | Usuário: {userMessages.length}
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
