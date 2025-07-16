import { AppShell } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserPlus, Users, Target, TrendingUp, Clock, Mail, Phone, Edit, Trash2 } from "lucide-react";

export default function TenantAdminTeam() {
  return (
    <AppShell>
      <div className="space-y-8">
        {/* Header */}
        <div className="border-b border-gray-200 pb-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Gestão da Equipe
              </h1>
              <p className="text-gray-600 mt-2">
                Gerenciar membros da equipe e performance
              </p>
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Adicionar Membro
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Adicionar Novo Membro</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome</Label>
                    <Input id="name" placeholder="Nome completo" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" placeholder="email@exemplo.com" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role">Função</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a função" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="agent">Agente</SelectItem>
                        <SelectItem value="supervisor">Supervisor</SelectItem>
                        <SelectItem value="manager">Gerente</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="team">Equipe</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a equipe" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="support">Suporte</SelectItem>
                        <SelectItem value="sales">Vendas</SelectItem>
                        <SelectItem value="technical">Técnico</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button className="w-full">Adicionar Membro</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Team Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Membros</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">24</div>
              <p className="text-xs text-muted-foreground">
                +2 novos este mês
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Agentes Online</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">18</div>
              <p className="text-xs text-muted-foreground">
                75% da equipe ativa
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Produtividade</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">94%</div>
              <p className="text-xs text-muted-foreground">
                +5% desde a semana passada
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tempo Médio</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12 min</div>
              <p className="text-xs text-muted-foreground">
                Tempo de resposta médio
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Team Members */}
        <Card>
          <CardHeader>
            <CardTitle>Membros da Equipe</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Membro</TableHead>
                  <TableHead>Função</TableHead>
                  <TableHead>Equipe</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Tickets Hoje</TableHead>
                  <TableHead>Satisfação</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[
                  {
                    name: 'Ana Silva',
                    avatar: '/avatars/ana.jpg',
                    role: 'Supervisor',
                    team: 'Suporte',
                    status: 'Online',
                    tickets: 23,
                    satisfaction: 4.8,
                    email: 'ana@acme.com'
                  },
                  {
                    name: 'Carlos Santos',
                    avatar: '/avatars/carlos.jpg',
                    role: 'Agente',
                    team: 'Suporte',
                    status: 'Online',
                    tickets: 18,
                    satisfaction: 4.6,
                    email: 'carlos@acme.com'
                  },
                  {
                    name: 'Mariana Costa',
                    avatar: '/avatars/mariana.jpg',
                    role: 'Agente',
                    team: 'Técnico',
                    status: 'Ausente',
                    tickets: 15,
                    satisfaction: 4.9,
                    email: 'mariana@acme.com'
                  },
                  {
                    name: 'João Oliveira',
                    avatar: '/avatars/joao.jpg',
                    role: 'Gerente',
                    team: 'Vendas',
                    status: 'Online',
                    tickets: 8,
                    satisfaction: 4.7,
                    email: 'joao@acme.com'
                  },
                  {
                    name: 'Beatriz Lima',
                    avatar: '/avatars/beatriz.jpg',
                    role: 'Agente',
                    team: 'Suporte',
                    status: 'Online',
                    tickets: 21,
                    satisfaction: 4.5,
                    email: 'beatriz@acme.com'
                  }
                ].map((member, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={member.avatar} />
                          <AvatarFallback>{member.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{member.name}</div>
                          <div className="text-sm text-gray-500">{member.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{member.role}</Badge>
                    </TableCell>
                    <TableCell>{member.team}</TableCell>
                    <TableCell>
                      <Badge variant={member.status === 'Online' ? 'default' : 'secondary'}>
                        {member.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">{member.tickets}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <span className="text-sm font-medium">{member.satisfaction}</span>
                        <span className="text-xs text-gray-500">/5</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Mail className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-red-600">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Team Performance */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Performance por Equipe</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { team: 'Suporte', members: 12, tickets: 156, satisfaction: 4.6 },
                { team: 'Técnico', members: 8, tickets: 89, satisfaction: 4.8 },
                { team: 'Vendas', members: 4, tickets: 45, satisfaction: 4.5 }
              ].map((team, index) => (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <div className="font-medium">{team.team}</div>
                    <div className="text-sm text-gray-500">{team.members} membros</div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{team.tickets} tickets</div>
                    <div className="text-sm text-gray-500">{team.satisfaction}/5 satisfação</div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Top Performers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { name: 'Ana Silva', tickets: 23, satisfaction: 4.8, badge: '🏆' },
                  { name: 'Beatriz Lima', tickets: 21, satisfaction: 4.5, badge: '🥈' },
                  { name: 'Carlos Santos', tickets: 18, satisfaction: 4.6, badge: '🥉' }
                ].map((performer, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{performer.badge}</span>
                      <div>
                        <div className="font-medium">{performer.name}</div>
                        <div className="text-sm text-gray-500">{performer.tickets} tickets resolvidos</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{performer.satisfaction}/5</div>
                      <div className="text-xs text-gray-500">Satisfação</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}