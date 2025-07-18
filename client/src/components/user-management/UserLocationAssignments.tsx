import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { 
  MapPin, 
  Plus, 
  Edit, 
  Trash2, 
  Building, 
  Shield,
  Clock,
  AlertCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface UserLocationAssignment {
  id: string;
  userId: string;
  locationId: string;
  locationName: string;
  locationAddress: string;
  role: 'assigned' | 'primary_contact' | 'backup_contact' | 'manager';
  isActive: boolean;
  isPrimary: boolean;
  accessLevel: 'basic' | 'advanced' | 'admin';
  specialPermissions: string[];
  assignedAt: string;
  validFrom?: string;
  validUntil?: string;
  notes?: string;
}

interface Location {
  id: string;
  name: string;
  address: string;
  type: string;
  status: string;
}

interface UserLocationAssignmentsProps {
  userId: string;
  userName: string;
}

export function UserLocationAssignments({ userId, userName }: UserLocationAssignmentsProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<UserLocationAssignment | null>(null);

  // Fetch user location assignments
  const { data: assignmentsData, isLoading: assignmentsLoading } = useQuery({
    queryKey: [`/api/tenant-admin/team/users/${userId}/locations`],
    enabled: !!userId,
  });

  // Fetch available locations
  const { data: locationsData } = useQuery({
    queryKey: ['/api/tenant-admin/team/locations'],
  });

  const assignments = assignmentsData?.assignments || [];
  const locations = locationsData?.locations || [];

  // Create assignment mutation
  const createAssignmentMutation = useMutation({
    mutationFn: (data: any) => apiRequest(`/api/tenant-admin/team/users/${userId}/locations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/tenant-admin/team/users/${userId}/locations`] });
      setShowAssignDialog(false);
      toast({
        title: "Sucesso",
        description: "Usuário vinculado ao local com sucesso",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao vincular usuário ao local",
        variant: "destructive",
      });
    }
  });

  // Update assignment mutation
  const updateAssignmentMutation = useMutation({
    mutationFn: ({ assignmentId, data }: { assignmentId: string; data: any }) => 
      apiRequest(`/api/tenant-admin/team/users/${userId}/locations/${assignmentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/tenant-admin/team/users/${userId}/locations`] });
      setEditingAssignment(null);
      toast({
        title: "Sucesso",
        description: "Vinculação atualizada com sucesso",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao atualizar vinculação",
        variant: "destructive",
      });
    }
  });

  // Delete assignment mutation
  const deleteAssignmentMutation = useMutation({
    mutationFn: (assignmentId: string) => 
      apiRequest(`/api/tenant-admin/team/users/${userId}/locations/${assignmentId}`, {
        method: 'DELETE'
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/tenant-admin/team/users/${userId}/locations`] });
      toast({
        title: "Sucesso",
        description: "Vinculação removida com sucesso",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao remover vinculação",
        variant: "destructive",
      });
    }
  });

  const handleCreateAssignment = (formData: FormData) => {
    const data = {
      locationId: formData.get('locationId') as string,
      role: formData.get('role') as string,
      isPrimary: formData.get('isPrimary') === 'on',
      accessLevel: formData.get('accessLevel') as string,
      notes: formData.get('notes') as string
    };
    createAssignmentMutation.mutate(data);
  };

  const handleUpdateAssignment = (assignmentId: string, formData: FormData) => {
    const data = {
      role: formData.get('role') as string,
      isPrimary: formData.get('isPrimary') === 'on',
      accessLevel: formData.get('accessLevel') as string,
      isActive: formData.get('isActive') === 'on',
      notes: formData.get('notes') as string
    };
    updateAssignmentMutation.mutate({ assignmentId, data });
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'manager': return 'bg-purple-100 text-purple-800';
      case 'primary_contact': return 'bg-blue-100 text-blue-800';
      case 'backup_contact': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getAccessLevelBadgeColor = (level: string) => {
    switch (level) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'advanced': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Locais Vinculados</h3>
          <p className="text-sm text-muted-foreground">
            Gerencie os locais onde {userName} tem acesso
          </p>
        </div>
        <Button 
          onClick={() => setShowAssignDialog(true)}
          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
        >
          <Plus className="mr-2 h-4 w-4" />
          Vincular Local
        </Button>
      </div>

      {/* Assignments Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Locais Atribuídos
          </CardTitle>
        </CardHeader>
        <CardContent>
          {assignmentsLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
              <p className="mt-2 text-sm text-muted-foreground">Carregando...</p>
            </div>
          ) : assignments.length === 0 ? (
            <div className="text-center py-8">
              <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Nenhum local vinculado</p>
              <p className="text-sm text-muted-foreground">
                Clique em "Vincular Local" para atribuir locais ao usuário
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Local</TableHead>
                  <TableHead>Papel</TableHead>
                  <TableHead>Nível de Acesso</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Atribuído em</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assignments.map((assignment: UserLocationAssignment) => (
                  <TableRow key={assignment.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Building className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{assignment.locationName}</p>
                          <p className="text-sm text-muted-foreground">
                            {assignment.locationAddress}
                          </p>
                          {assignment.isPrimary && (
                            <Badge variant="secondary" className="mt-1 text-xs">
                              Principal
                            </Badge>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getRoleBadgeColor(assignment.role)}>
                        {assignment.role === 'manager' ? 'Gerente' :
                         assignment.role === 'primary_contact' ? 'Contato Principal' :
                         assignment.role === 'backup_contact' ? 'Contato Backup' : 'Atribuído'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getAccessLevelBadgeColor(assignment.accessLevel)}>
                        <Shield className="mr-1 h-3 w-3" />
                        {assignment.accessLevel === 'admin' ? 'Admin' :
                         assignment.accessLevel === 'advanced' ? 'Avançado' : 'Básico'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={assignment.isActive ? 'default' : 'secondary'}>
                        {assignment.isActive ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {new Date(assignment.assignedAt).toLocaleDateString('pt-BR')}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center gap-2 justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingAssignment(assignment)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteAssignmentMutation.mutate(assignment.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create Assignment Dialog */}
      <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Vincular Usuário ao Local</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => {
            e.preventDefault();
            handleCreateAssignment(new FormData(e.currentTarget));
          }}>
            <div className="space-y-4">
              <div>
                <Label htmlFor="locationId">Local</Label>
                <Select name="locationId" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um local" />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.map((location: Location) => (
                      <SelectItem key={location.id} value={location.id}>
                        {location.name} - {location.address}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="role">Papel</Label>
                <Select name="role" defaultValue="assigned">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="assigned">Atribuído</SelectItem>
                    <SelectItem value="primary_contact">Contato Principal</SelectItem>
                    <SelectItem value="backup_contact">Contato Backup</SelectItem>
                    <SelectItem value="manager">Gerente</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="accessLevel">Nível de Acesso</Label>
                <Select name="accessLevel" defaultValue="basic">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="basic">Básico</SelectItem>
                    <SelectItem value="advanced">Avançado</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox name="isPrimary" id="isPrimary" />
                <Label htmlFor="isPrimary">Local principal do usuário</Label>
              </div>

              <div>
                <Label htmlFor="notes">Observações</Label>
                <Textarea name="notes" placeholder="Observações adicionais (opcional)" />
              </div>
            </div>

            <div className="flex justify-end space-x-2 mt-6">
              <Button type="button" variant="outline" onClick={() => setShowAssignDialog(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={createAssignmentMutation.isPending}>
                {createAssignmentMutation.isPending ? 'Vinculando...' : 'Vincular'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Assignment Dialog */}
      {editingAssignment && (
        <Dialog open={!!editingAssignment} onOpenChange={() => setEditingAssignment(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Vinculação</DialogTitle>
            </DialogHeader>
            <form onSubmit={(e) => {
              e.preventDefault();
              handleUpdateAssignment(editingAssignment.id, new FormData(e.currentTarget));
            }}>
              <div className="space-y-4">
                <div>
                  <Label>Local</Label>
                  <div className="p-3 bg-gray-50 rounded-md">
                    <p className="font-medium">{editingAssignment.locationName}</p>
                    <p className="text-sm text-muted-foreground">{editingAssignment.locationAddress}</p>
                  </div>
                </div>

                <div>
                  <Label htmlFor="role">Papel</Label>
                  <Select name="role" defaultValue={editingAssignment.role}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="assigned">Atribuído</SelectItem>
                      <SelectItem value="primary_contact">Contato Principal</SelectItem>
                      <SelectItem value="backup_contact">Contato Backup</SelectItem>
                      <SelectItem value="manager">Gerente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="accessLevel">Nível de Acesso</Label>
                  <Select name="accessLevel" defaultValue={editingAssignment.accessLevel}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="basic">Básico</SelectItem>
                      <SelectItem value="advanced">Avançado</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox name="isPrimary" id="isPrimary" defaultChecked={editingAssignment.isPrimary} />
                  <Label htmlFor="isPrimary">Local principal do usuário</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox name="isActive" id="isActive" defaultChecked={editingAssignment.isActive} />
                  <Label htmlFor="isActive">Vinculação ativa</Label>
                </div>

                <div>
                  <Label htmlFor="notes">Observações</Label>
                  <Textarea name="notes" defaultValue={editingAssignment.notes || ''} placeholder="Observações adicionais (opcional)" />
                </div>
              </div>

              <div className="flex justify-end space-x-2 mt-6">
                <Button type="button" variant="outline" onClick={() => setEditingAssignment(null)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={updateAssignmentMutation.isPending}>
                  {updateAssignmentMutation.isPending ? 'Atualizando...' : 'Atualizar'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}