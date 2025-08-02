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
    enabled: selectedUserId !== 'default',
  });

  // Buscar movimentações
  const { data: movements, isLoading: movementsLoading } = useQuery({
    queryKey: ['/api/timecard/hour-bank/movements', selectedUserId, selectedMonth],
    enabled: selectedUserId !== 'default',
  });

  // Buscar usuários/funcionários via endpoint de admin que funciona
  const { data: users } = useQuery({
    queryKey: ['/api/tenant-admin/users'],
  });

  // Buscar resumo geral
  const { data: summary } = useQuery({
    queryKey: ['/api/timecard/hour-bank/summary'],
  });

  const formatHours = (hours: number) => {
    const absHours = Math.abs(hours);
    const hoursInt = Math.floor(absHours);
    const minutes = Math.round((absHours - hoursInt) * 60);
    return `${hours < 0 ? '-' : ''}${hoursInt}h${minutes > 0 ? ` ${minutes}m` : ''}`;
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
      return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Expirando</Badge>;
    }
    return <Badge className="bg-green-100 text-green-800">Ativo</Badge>;
  };

  return (
    <div className="p-4 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Banco de Horas</h1>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="userId">Funcionário</Label>
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o funcionário" />
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Funcionários</p>
                <p className="text-2xl font-bold">{summary?.totalEmployees || 0}</p>
              </div>
              <CreditCard className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Saldo Total</p>
                <p className={`text-2xl font-bold ${getBalanceColor(summary?.totalBalance || 0)}`}>
                  {formatHours(summary?.totalBalance || 0)}
                </p>
              </div>
              <Clock className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Horas Expirando</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {formatHours(summary?.expiringHours || 0)}
                </p>
              </div>
              <AlertCircle className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Movimento do Mês</p>
                <p className={`text-2xl font-bold ${getBalanceColor(summary?.monthlyMovement || 0)}`}>
                  {formatHours(summary?.monthlyMovement || 0)}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {selectedUserId !== 'default' ? (
        <Tabs defaultValue="balance" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="balance">Saldo</TabsTrigger>
            <TabsTrigger value="movements">Movimentações</TabsTrigger>
          </TabsList>

          {/* Aba Saldo */}
          <TabsContent value="balance" className="space-y-4">
            {hourBankLoading ? (
              <div className="animate-pulse space-y-4">
                <div className="h-32 bg-gray-200 rounded"></div>
              </div>
            ) : hourBank ? (
              <Card>
                <CardHeader>
                  <CardTitle>Saldo Detalhado - {hourBank.userName}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center p-4 bg-blue-50 rounded">
                        <span className="font-medium">Saldo Atual:</span>
                        <span className={`text-xl font-bold ${getBalanceColor(hourBank.balanceHours)}`}>
                          {formatHours(hourBank.balanceHours)}
                        </span>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>Horas Ganhas no Mês:</span>
                          <span className="text-green-600 font-medium">
                            +{formatHours(hourBank.earnedHours)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Horas Utilizadas:</span>
                          <span className="text-red-600 font-medium">
                            -{formatHours(hourBank.usedHours)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Horas Expiradas:</span>
                          <span className="text-orange-600 font-medium">
                            -{formatHours(hourBank.expiredHours)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="p-4 border rounded">
                        <h4 className="font-medium mb-2">Informações de Expiração</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>Status:</span>
                            {getStatusBadge(hourBank.status, hourBank.expirationDate)}
                          </div>
                          <div className="flex justify-between">
                            <span>Data de Vencimento:</span>
                            <span>
                              {format(new Date(hourBank.expirationDate), 'dd/MM/yyyy', { locale: ptBR })}
                            </span>
                          </div>
                          <div className="flex justify-between">
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
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-5 w-5 text-yellow-600" />
                        <span className="font-medium text-yellow-800">Atenção: Horas próximas do vencimento</span>
                      </div>
                      <p className="text-sm text-yellow-700 mt-1">
                        {formatHours(hourBank.balanceHours)} expirarão em {format(new Date(hourBank.expirationDate), 'dd/MM/yyyy', { locale: ptBR })}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <Clock className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-medium mb-2">Nenhum registro encontrado</h3>
                  <p className="text-gray-600">
                    Não há banco de horas para este funcionário no período selecionado
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Aba Movimentações */}
          <TabsContent value="movements" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Histórico de Movimentações</CardTitle>
              </CardHeader>
              <CardContent>
                {movementsLoading ? (
                  <div className="animate-pulse space-y-4">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="h-16 bg-gray-200 rounded"></div>
                    ))}
                  </div>
                ) : (movements as any)?.length > 0 ? (
                  <div className="space-y-3">
                    {(movements as HourBankMovement[]).map((movement) => (
                      <div key={movement.id} className="flex justify-between items-center p-4 border rounded">
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${
                            movement.movementType === 'credit' ? 'bg-green-500' :
                            movement.movementType === 'debit' ? 'bg-red-500' :
                            movement.movementType === 'expiration' ? 'bg-orange-500' : 'bg-blue-500'
                          }`}></div>
                          <div>
                            <div className="font-medium">{movement.description}</div>
                            <div className="text-sm text-gray-600">
                              {format(new Date(movement.movementDate), 'dd/MM/yyyy', { locale: ptBR })}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`font-medium ${movementTypeColors[movement.movementType]}`}>
                            {movement.movementType === 'credit' ? '+' : movement.movementType === 'debit' ? '-' : ''}
                            {formatHours(movement.hours)}
                          </div>
                          <Badge variant="outline">
                            {movementTypeLabels[movement.movementType]}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    Nenhuma movimentação encontrada para o período
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <CreditCard className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium mb-2">Selecione um funcionário</h3>
            <p className="text-gray-600">
              Escolha um funcionário nos filtros acima para visualizar o banco de horas
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}