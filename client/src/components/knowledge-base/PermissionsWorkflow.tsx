/**
 * Permissions and Workflow Component for Knowledge Base
 * Advanced approval system with role-based permissions
 */

import { useState } from 'react'
import { Button } from "../ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar"
import { Badge } from "../ui/badge"
import { Separator } from "../ui/separator"
import { Textarea } from "../ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog"
import { Progress } from "../ui/progress"
import { 
  Shield,
  Users,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Edit,
  Trash2,
  AlertTriangle,
  MessageSquare,
  Calendar,
  ArrowRight,
  RotateCcw,
  Send
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface WorkflowStep {
  id: string
  name: string
  role: string
  status: 'pending' | 'approved' | 'rejected' | 'skipped'
  assignedTo?: {
    id: string
    name: string
    avatar?: string
  }
  completedAt?: Date
  comment?: string
  order: number
}

interface ApprovalWorkflow {
  id: string
  articleId: string
  articleTitle: string
  status: 'draft' | 'pending' | 'approved' | 'rejected' | 'published'
  initiator: {
    id: string
    name: string
    avatar?: string
    role: string
  }
  createdAt: Date
  updatedAt: Date
  steps: WorkflowStep[]
  currentStep: number
  rejectionReason?: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
}

interface Permission {
  id: string
  name: string
  description: string
  resource: string
  action: string
  condition?: string
}

interface Role {
  id: string
  name: string
  description: string
  permissions: Permission[]
  userCount: number
  isSystem: boolean
}

interface PermissionsWorkflowProps {
  workflows: ApprovalWorkflow[]
  roles: Role[]
  currentUserId: string
  userRole: string
  onApprove: (workflowId: string, stepId: string, comment?: string) => void
  onReject: (workflowId: string, stepId: string, reason: string) => void
  onReassign: (workflowId: string, stepId: string, userId: string) => void
  onCreateWorkflow: (articleId: string, steps: Omit<WorkflowStep, 'id' | 'status' | 'order'>[]) => void
  onUpdateRole: (roleId: string, permissions: string[]) => void
  availableUsers: { id: string; name: string; role: string; avatar?: string }[]
}

export function PermissionsWorkflow({
  workflows,
  roles,
  currentUserId,
  userRole,
  onApprove,
  onReject,
  onReassign,
  onCreateWorkflow,
  onUpdateRole,
  availableUsers
}: PermissionsWorkflowProps) {
  const [selectedWorkflow, setSelectedWorkflow] = useState<ApprovalWorkflow | null>(null)
  const [approvalComment, setApprovalComment] = useState('')
  const [rejectionReason, setRejectionReason] = useState('')
  const [showWorkflowDialog, setShowWorkflowDialog] = useState(false)
  const [showRoleDialog, setShowRoleDialog] = useState(false)
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)
  const [activeTab, setActiveTab] = useState<'workflows' | 'roles' | 'permissions'>('workflows')

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800'
      case 'rejected': return 'bg-red-100 text-red-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'published': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500'
      case 'high': return 'bg-orange-500'
      case 'medium': return 'bg-yellow-500'
      case 'low': return 'bg-green-500'
      default: return 'bg-gray-500'
    }
  }

  const getWorkflowProgress = (workflow: ApprovalWorkflow) => {
    const totalSteps = workflow.steps.length
    const completedSteps = workflow.steps.filter(step => 
      step.status === 'approved' || step.status === 'skipped'
    ).length
    return totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0
  }

  const canUserApprove = (workflow: ApprovalWorkflow) => {
    const currentStep = workflow.steps[workflow.currentStep]
    return currentStep && 
           currentStep.status === 'pending' && 
           (currentStep.assignedTo?.id === currentUserId || 
            availableUsers.find(u => u.id === currentUserId)?.role === currentStep.role)
  }

  const pendingWorkflows = workflows.filter(w => w.status === 'pending')
  const myWorkflows = workflows.filter(w => 
    w.initiator.id === currentUserId || 
    w.steps.some(step => step.assignedTo?.id === currentUserId)
  )

  return (
    <div className="space-y-6">
      {/* Header with Tabs */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Permissões e Fluxo de Aprovação</h2>
          <p className="text-gray-600">Gerenciar aprovações e permissões da base de conhecimento</p>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant={activeTab === 'workflows' ? 'default' : 'outline'}
            onClick={() => setActiveTab('workflows')}
          >
            <Clock className="h-4 w-4 mr-2" />
            Fluxos ({pendingWorkflows.length})
          </Button>
          <Button
            variant={activeTab === 'roles' ? 'default' : 'outline'}
            onClick={() => setActiveTab('roles')}
          >
            <Users className="h-4 w-4 mr-2" />
            Papéis ({roles.length})
          </Button>
          <Button
            variant={activeTab === 'permissions' ? 'default' : 'outline'}
            onClick={() => setActiveTab('permissions')}
          >
            <Shield className="h-4 w-4 mr-2" />
            Permissões
          </Button>
        </div>
      </div>

      {/* Workflows Tab */}
      {activeTab === 'workflows' && (
        <div className="space-y-6">
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-yellow-600" />
                  <span className="text-sm font-medium">Pendentes</span>
                </div>
                <div className="text-2xl font-bold mt-2">
                  {pendingWorkflows.length}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="text-sm font-medium">Aprovados</span>
                </div>
                <div className="text-2xl font-bold mt-2">
                  {workflows.filter(w => w.status === 'approved').length}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <XCircle className="h-5 w-5 text-red-600" />
                  <span className="text-sm font-medium">Rejeitados</span>
                </div>
                <div className="text-2xl font-bold mt-2">
                  {workflows.filter(w => w.status === 'rejected').length}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Send className="h-5 w-5 text-blue-600" />
                  <span className="text-sm font-medium">Publicados</span>
                </div>
                <div className="text-2xl font-bold mt-2">
                  {workflows.filter(w => w.status === 'published').length}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Pending Approvals */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Aprovações Pendentes
              </CardTitle>
              <CardDescription>
                Fluxos aguardando sua aprovação ou revisão
              </CardDescription>
            </CardHeader>
            <CardContent>
              {pendingWorkflows.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Clock className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>Nenhuma aprovação pendente</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingWorkflows.filter(w => canUserApprove(w)).map(workflow => (
                    <div key={workflow.id} className="border rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium">{workflow.articleTitle}</h4>
                            <Badge className={getStatusColor(workflow.status)}>
                              {workflow.status === 'pending' ? 'Pendente' : 
                               workflow.status === 'approved' ? 'Aprovado' : 
                               workflow.status === 'rejected' ? 'Rejeitado' : 'Publicado'}
                            </Badge>
                            <div className={`w-2 h-2 rounded-full ${getPriorityColor(workflow.priority)}`} />
                          </div>
                          
                          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                            <span>Iniciado por {workflow.initiator.name}</span>
                            <span>•</span>
                            <span>{formatDistanceToNow(workflow.createdAt, { addSuffix: true, locale: ptBR })}</span>
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span>Progresso do fluxo</span>
                              <span>{workflow.currentStep + 1} de {workflow.steps.length} etapas</span>
                            </div>
                            <Progress value={getWorkflowProgress(workflow)} className="h-2" />
                          </div>
                        </div>

                        <div className="flex gap-2 ml-4">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button size="sm" variant="outline">
                                <Eye className="h-4 w-4 mr-2" />
                                Visualizar
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-4xl">
                              <DialogHeader>
                                <DialogTitle>Fluxo de Aprovação: {workflow.articleTitle}</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-6">
                                {/* Workflow Steps */}
                                <div className="space-y-4">
                                  {workflow.steps.map((step, index) => (
                                    <div key={step.id} className="flex items-center gap-4">
                                      <div className={`
                                        w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
                                        ${step.status === 'approved' ? 'bg-green-100 text-green-800' :
                                          step.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                          step.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                          'bg-gray-100 text-gray-800'}
                                      `}>
                                        {index + 1}
                                      </div>
                                      
                                      <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                          <span className="font-medium">{step.name}</span>
                                          <Badge variant="outline">{step.role}</Badge>
                                          {step.status === 'approved' && <CheckCircle className="h-4 w-4 text-green-600" />}
                                          {step.status === 'rejected' && <XCircle className="h-4 w-4 text-red-600" />}
                                          {step.status === 'pending' && <Clock className="h-4 w-4 text-yellow-600" />}
                                        </div>
                                        
                                        {step.assignedTo && (
                                          <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                                            <Avatar className="h-5 w-5">
                                              <AvatarImage src={step.assignedTo.avatar} />
                                              <AvatarFallback className="text-xs">
                                                {step.assignedTo.name.charAt(0)}
                                              </AvatarFallback>
                                            </Avatar>
                                            <span>{step.assignedTo.name}</span>
                                            {step.completedAt && (
                                              <>
                                                <span>•</span>
                                                <span>{formatDistanceToNow(step.completedAt, { addSuffix: true, locale: ptBR })}</span>
                                              </>
                                            )}
                                          </div>
                                        )}
                                        
                                        {step.comment && (
                                          <p className="text-sm text-gray-600 mt-2 bg-gray-50 p-2 rounded">
                                            {step.comment}
                                          </p>
                                        )}
                                      </div>

                                      {step.status === 'pending' && step.assignedTo?.id === currentUserId && (
                                        <div className="flex gap-2">
                                          <Dialog>
                                            <DialogTrigger asChild>
                                              <Button size="sm" variant="outline">
                                                <CheckCircle className="h-4 w-4 mr-2" />
                                                Aprovar
                                              </Button>
                                            </DialogTrigger>
                                            <DialogContent>
                                              <DialogHeader>
                                                <DialogTitle>Aprovar Etapa</DialogTitle>
                                              </DialogHeader>
                                              <div className="space-y-4">
                                                <Textarea
                                                  value={approvalComment}
                                                  onChange={(e) => setApprovalComment(e.target.value)}
                                                  placeholder="Comentário da aprovação (opcional)..."
                                                />
                                                <Button 
                                                  onClick={() => {
                                                    onApprove(workflow.id, step.id, approvalComment)
                                                    setApprovalComment('')
                                                  }}
                                                  className="w-full"
                                                >
                                                  Confirmar Aprovação
                                                </Button>
                                              </div>
                                            </DialogContent>
                                          </Dialog>

                                          <Dialog>
                                            <DialogTrigger asChild>
                                              <Button size="sm" variant="outline">
                                                <XCircle className="h-4 w-4 mr-2" />
                                                Rejeitar
                                              </Button>
                                            </DialogTrigger>
                                            <DialogContent>
                                              <DialogHeader>
                                                <DialogTitle>Rejeitar Etapa</DialogTitle>
                                              </DialogHeader>
                                              <div className="space-y-4">
                                                <Textarea
                                                  value={rejectionReason}
                                                  onChange={(e) => setRejectionReason(e.target.value)}
                                                  placeholder="Motivo da rejeição (obrigatório)..."
                                                  required
                                                />
                                                <Button 
                                                  onClick={() => {
                                                    if (rejectionReason.trim()) {
                                                      onReject(workflow.id, step.id, rejectionReason)
                                                      setRejectionReason('')
                                                    }
                                                  }}
                                                  variant="destructive"
                                                  className="w-full"
                                                  disabled={!rejectionReason.trim()}
                                                >
                                                  Confirmar Rejeição
                                                </Button>
                                              </div>
                                            </DialogContent>
                                          </Dialog>
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Roles Tab */}
      {activeTab === 'roles' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Gerenciamento de Papéis
              </CardTitle>
              <CardDescription>
                Configure papéis e suas permissões no sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {roles.map(role => (
                  <Card key={role.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">{role.name}</h4>
                          {role.isSystem && (
                            <Badge variant="secondary" className="text-xs">
                              Sistema
                            </Badge>
                          )}
                        </div>
                        
                        <p className="text-sm text-gray-600">{role.description}</p>
                        
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500">
                            {role.userCount} usuários
                          </span>
                          <span className="text-gray-500">
                            {role.permissions.length} permissões
                          </span>
                        </div>

                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="flex-1"
                            onClick={() => {
                              setSelectedRole(role)
                              setShowRoleDialog(true)
                            }}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Editar
                          </Button>
                          {!role.isSystem && (
                            <Button size="sm" variant="outline">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Permissions Tab */}
      {activeTab === 'permissions' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Matriz de Permissões
              </CardTitle>
              <CardDescription>
                Visualizar e gerenciar todas as permissões do sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {roles.map(role => (
                  <div key={role.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium flex items-center gap-2">
                        {role.name}
                        {role.isSystem && (
                          <Badge variant="secondary" className="text-xs">Sistema</Badge>
                        )}
                      </h4>
                      <span className="text-sm text-gray-500">
                        {role.permissions.length} permissões
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                      {role.permissions.map(permission => (
                        <div 
                          key={permission.id} 
                          className="flex items-center gap-2 p-2 bg-gray-50 rounded text-sm"
                        >
                          <Shield className="h-3 w-3 text-blue-600" />
                          <span className="font-medium">{permission.resource}</span>
                          <span className="text-gray-500">•</span>
                          <span>{permission.action}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}