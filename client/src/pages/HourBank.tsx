import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Clock, TrendingUp, TrendingDown, CalendarDays, AlertCircle, CreditCard } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { apiRequest } from '@/lib/queryClient';
// import useLocalization from '@/hooks/useLocalization';
interface HourBankEntry {
  id: string;
  userId: string;
  referenceMonth: string;
  balanceHours: number;
  earnedHours: number;
  usedHours: number;
  expiredHours: number;
  expirationDate: string;
  status: 'active' | 'expired' | 'used';
  userName?: string;
}
interface HourBankMovement {
  id: string;
  userId: string;
  movementDate: string;
  movementType: 'credit' | 'debit' | 'expiration' | 'adjustment';
  hours: number;
  description: string;
  userName?: string;
}
const movementTypeLabels = {
  // Localization temporarily disabled
  credit: 'Crédito',
  debit: 'Débito',
  expiration: 'Expiração',
  adjustment: 'Ajuste'
};
const movementTypeColors = {
  credit: 'text-green-600',
  debit: 'text-red-600',
  expiration: 'text-orange-600',
  adjustment: 'text-blue-600'
};
export default function HourBank() {
  const [selectedUserId, setSelectedUserId] = useState('default');
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
  // Buscar banco de horas
  const { data: hourBank, isLoading: hourBankLoading } = useQuery({
    queryKey: ['/api/timecard/hour-bank', selectedUserId, selectedMonth],
    queryFn: async () => {
      const response = await apiRequest('GET', "
      return response.json();
    },
    enabled: selectedUserId !== 'default',
  });
  // Buscar movimentações
  const { data: movements, isLoading: movementsLoading } = useQuery({
    queryKey: ['/api/timecard/hour-bank/movements', selectedUserId, selectedMonth],
    queryFn: async () => {
      const response = await apiRequest('GET', "
      return response.json();
    },
    enabled: selectedUserId !== 'default',
  });
  // Buscar usuários/funcionários via endpoint de admin que funciona
  const { data: users } = useQuery({
    queryKey: ['/api/tenant-admin/users'],
  });
  // Buscar resumo geral
  const { data: summary } = useQuery({
    queryKey: ['/api/timecard/hour-bank/summary'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/timecard/hour-bank/summary');
      return response.json();
    }
  });
  const formatHours = (hours: number) => {
    const absHours = Math.abs(hours);
    const hoursInt = Math.floor(absHours);
    const minutes = Math.round((absHours - hoursInt) * 60);
    return "m` : ''";
  };
  const getBalanceColor = (balance: number) => {
    if (balance > 0) return 'text-green-600';
    if (balance < 0) return 'text-red-600';
    return 'text-gray-600';
  };
  const getStatusBadge = (status: string, expirationDate: string) => {
    const isExpiring = new Date(expirationDate) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 dias
    
    if (status === 'expired') {
      return <Badge variant="destructive">Expirado</Badge>;
    }
    if (isExpiring) {
      return <Badge variant="secondary" className="text-lg">"Expirando</Badge>;
    }
    return <Badge className="text-lg">"Ativo</Badge>;
  };
  return (
    <div className=""
      <div className=""
        <h1 className="text-lg">"Banco de Horas</h1>
      </div>
      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className=""
            <div>
              <Label htmlFor="userId">Funcionário</Label>
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger>
                  <SelectValue placeholder='[TRANSLATION_NEEDED]' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Selecione o funcionário</SelectItem>
                  {(users as any)?.users?.map((user: any) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.firstName || user.first_name || user.name || ''} {user.lastName || user.last_name || ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="month">Mês de Referência</Label>
              <Input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>
      {/* Resumo Geral */}
      <div className=""
        <Card>
          <CardContent className=""
            <div className=""
              <div>
                <p className="text-lg">"Total Funcionários</p>
                <p className="text-lg">"{summary?.totalEmployees || 0}</p>
              </div>
              <CreditCard className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className=""
            <div className=""
              <div>
                <p className="text-lg">"Saldo Total</p>
                <p className="text-lg">"
                  {formatHours(summary?.totalBalance || 0)}
                </p>
              </div>
              <Clock className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className=""
            <div className=""
              <div>
                <p className="text-lg">"Horas Expirando</p>
                <p className=""
                  {formatHours(summary?.expiringHours || 0)}
                </p>
              </div>
              <AlertCircle className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className=""
            <div className=""
              <div>
                <p className="text-lg">"Movimento do Mês</p>
                <p className="text-lg">"
                  {formatHours(summary?.monthlyMovement || 0)}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>
      {selectedUserId !== 'default' ? (
        <Tabs defaultValue="balance" className=""
          <TabsList className=""
            <TabsTrigger value="balance">Saldo</TabsTrigger>
            <TabsTrigger value="movements">Movimentações</TabsTrigger>
          </TabsList>
          {/* Aba Saldo */}
          <TabsContent value="balance" className=""
            {hourBankLoading ? (
              <div className=""
                <div className="text-lg">"</div>
              </div>
            ) : hourBank ? (
              <Card>
                <CardHeader>
                  <CardTitle>Saldo Detalhado - {hourBank.userName}</CardTitle>
                </CardHeader>
                <CardContent className=""
                  <div className=""
                    <div className=""
                      <div className=""
                        <span className="text-lg">"Saldo Atual:</span>
                        <span className="text-lg">"
                          {formatHours(hourBank.balanceHours)}
                        </span>
                      </div>
                      <div className=""
                        <div className=""
                          <span>Horas Ganhas no Mês:</span>
                          <span className=""
                            +{formatHours(hourBank.earnedHours)}
                          </span>
                        </div>
                        <div className=""
                          <span>Horas Utilizadas:</span>
                          <span className=""
                            -{formatHours(hourBank.usedHours)}
                          </span>
                        </div>
                        <div className=""
                          <span>Horas Expiradas:</span>
                          <span className=""
                            -{formatHours(hourBank.expiredHours)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className=""
                      <div className=""
                        <h4 className="text-lg">"Informações de Expiração</h4>
                        <div className=""
                          <div className=""
                            <span>Status:</span>
                            {getStatusBadge(hourBank.status, hourBank.expirationDate)}
                          </div>
                          <div className=""
                            <span>Data de Vencimento:</span>
                            <span>
                              {format(new Date(hourBank.expirationDate), 'dd/MM/yyyy', { locale: ptBR })}
                            </span>
                          </div>
                          <div className=""
                            <span>Referência:</span>
                            <span>
                              {format(new Date(hourBank.referenceMonth), 'MMMM/yyyy', { locale: ptBR })}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  {hourBank.balanceHours > 0 && new Date(hourBank.expirationDate) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) && (
                    <div className=""
                      <div className=""
                        <AlertCircle className="h-5 w-5 text-yellow-600" />
                        <span className="text-lg">"Atenção: Horas próximas do vencimento</span>
                      </div>
                      <p className=""
                        {formatHours(hourBank.balanceHours)} expirarão em {format(new Date(hourBank.expirationDate), 'dd/MM/yyyy', { locale: ptBR })}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className=""
                  <Clock className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg">"Nenhum registro encontrado</h3>
                  <p className=""
                    Não há banco de horas para este funcionário no período selecionado
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          {/* Aba Movimentações */}
          <TabsContent value="movements" className=""
            <Card>
              <CardHeader>
                <CardTitle>Histórico de Movimentações</CardTitle>
              </CardHeader>
              <CardContent>
                {movementsLoading ? (
                  <div className=""
                    {[1, 2, 3].map(i => (
                      <div key={i} className="text-lg">"</div>
                    ))}
                  </div>
                ) : (movements as any)?.length > 0 ? (
                  <div className=""
                    {(movements as HourBankMovement[]).map((movement) => (
                      <div key={movement.id} className=""
                        <div className=""
                          <div className={`w-3 h-3 rounded-full ${
                            movement.movementType === 'credit' ? 'bg-green-500' :
                            movement.movementType === 'debit' ? 'bg-red-500' :
                            movement.movementType === 'expiration' ? 'bg-orange-500' : 'bg-blue-500'
                          "></div>
                          <div>
                            <div className="text-lg">"{movement.description}</div>
                            <div className=""
                              {format(new Date(movement.movementDate), 'dd/MM/yyyy', { locale: ptBR })}
                            </div>
                          </div>
                        </div>
                        <div className=""
                          <div className="text-lg">"
                            {movement.movementType === 'credit' ? '+' : movement.movementType === 'debit' ? '-' : ''}
                            {formatHours(movement.hours)}
                          </div>
                          <Badge variant="outline>
                            {movementTypeLabels[movement.movementType]}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className=""
                    Nenhuma movimentação encontrada para o período
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      ) : (
        <Card>
          <CardContent className=""
            <CreditCard className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg">"Selecione um funcionário</h3>
            <p className=""
              Escolha um funcionário nos filtros acima para visualizar o banco de horas
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}