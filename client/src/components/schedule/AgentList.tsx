import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, Calendar, Clock, MapPin } from 'lucide-react';
import { format, parseISO, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import SimpleAvatar from '@/components/SimpleAvatar';
interface Schedule {
  id: string;
  title: string;
  startDateTime: string;
  endDateTime: string;
  status: string;
  priority: string;
  locationAddress?: string;
  agentId: string;
}
interface Agent {
  id: string;
  name: string;
  email: string;
  profileImageUrl?: string;
}
interface AgentListProps {
  agents: Agent[];
  schedules: Schedule[];
  selectedDate: Date;
  onAgentSelect: (agentId: string) => void;
  selectedAgentId?: string;
}
const AgentList: React.FC<AgentListProps> = ({
  agents,
  schedules,
  selectedDate,
  onAgentSelect,
  selectedAgentId,
}) => {
  const getAgentStats = (agentId: string) => {
    const agentSchedules = schedules.filter(s => s.agentId === agentId);
    const todaySchedules = agentSchedules.filter(s => 
      isSameDay(parseISO(s.startDateTime), selectedDate)
    );
    
    return {
      total: agentSchedules.length,
      today: todaySchedules.length,
      inProgress: todaySchedules.filter(s => s.status === 'in_progress').length,
      urgent: todaySchedules.filter(s => s.priority === 'urgent').length,
    };
  };
  const getNextSchedule = (agentId: string) => {
    const agentSchedules = schedules
      .filter(s => s.agentId === agentId && s.status === 'scheduled')
      .sort((a, b) => new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime());
    
    return agentSchedules[0];
  };
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'default';
      case 'in_progress': return 'secondary';
      case 'completed': return 'outline';
      case 'cancelled': return 'destructive';
      default: return 'default';
    }
  };
  return (
    <Card className="h-full>
      <CardHeader>
        <CardTitle className="flex items-center>
          <User className="h-5 w-5 mr-2" />
          Agentes de Campo
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0>
        <div className="max-h-[600px] overflow-y-auto>
          {agents.map((agent) => {
            const stats = getAgentStats(agent.id);
            const nextSchedule = getNextSchedule(agent.id);
            const isSelected = selectedAgentId === agent.id;
            
            return (
              <div
                key={agent.id}
                className={`
                  p-4 border-b cursor-pointer transition-all hover:bg-gray-50
                  ${isSelected ? 'bg-blue-50 border-l-4 border-blue-500' : ''}
                "
                onClick={() => onAgentSelect(agent.id)}
              >
                {/* Agent Info */}
                <div className="flex items-center space-x-3 mb-3>
                  <SimpleAvatar 
                    src={agent.profileImageUrl} 
                    name={agent.name} 
                    size="md" 
                  />
                  <div className="flex-1>
                    <div className="text-lg">"{agent.name}</div>
                    <div className="text-lg">"{agent.email}</div>
                  </div>
                  {stats.inProgress > 0 && (
                    <Badge variant="secondary" className="bg-yellow-100 text-yellow-800>
                      Em atividade
                    </Badge>
                  )}
                </div>
                {/* Agent Stats */}
                <div className="grid grid-cols-2 gap-2 mb-3>
                  <div className="text-center p-2 bg-gray-50 rounded>
                    <div className="text-lg">"{stats.today}</div>
                    <div className="text-lg">"Hoje</div>
                  </div>
                  <div className="text-center p-2 bg-gray-50 rounded>
                    <div className="text-lg">"{stats.total}</div>
                    <div className="text-lg">"Total</div>
                  </div>
                </div>
                {/* Priority Alerts */}
                {stats.urgent > 0 && (
                  <div className="mb-3>
                    <Badge variant="destructive" className="text-xs>
                      {stats.urgent} urgente{stats.urgent > 1 ? 's' : ''}
                    </Badge>
                  </div>
                )}
                {/* Next Schedule */}
                {nextSchedule && (
                  <div className="bg-blue-50 p-3 rounded-lg>
                    <div className="text-lg">"Próximo agendamento:</div>
                    <div className="text-sm font-medium text-gray-900 mb-1>
                      {nextSchedule.title}
                    </div>
                    <div className="flex items-center text-xs text-gray-600 space-x-2>
                      <div className="flex items-center>
                        <Clock className="w-3 h-3 mr-1" />
                        {format(parseISO(nextSchedule.startDateTime), 'HH:mm', { locale: ptBR })}
                      </div>
                      {nextSchedule.locationAddress && (
                        <div className="flex items-center>
                          <MapPin className="w-3 h-3 mr-1" />
                          <span className="truncate max-w-[120px]>
                            {nextSchedule.locationAddress.split(',')[0]}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                {/* No schedules message */}
                {stats.today === 0 && (
                  <div className="text-center py-2 text-gray-500 text-sm>
                    Nenhum agendamento hoje
                  </div>
                )}
              </div>
            );
          })}
        </div>
        {agents.length === 0 && (
          <div className="p-8 text-center text-gray-500>
            <User className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>Nenhum agente encontrado</p>
            <p className="text-lg">"Configure agentes no módulo de usuários</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
export default AgentList;