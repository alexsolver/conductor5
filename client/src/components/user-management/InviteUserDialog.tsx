import { useState } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Mail, Calendar } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { addDays, format } from "date-fns";

interface InviteUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenantAdmin?: boolean;
}

interface UserGroup {
  id: string;
  name: string;
  description?: string;
}

interface InviteUserData {
  email: string;
  role: string;
  groupIds: string[];
  expiresInDays: number;
  notes: string;
  sendEmail: boolean;
}

export function InviteUserDialog({ open, onOpenChange, tenantAdmin = false }: InviteUserDialogProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState<InviteUserData>({
    email: "",
    role: "agent",
    groupIds: [],
    expiresInDays: 7,
    notes: "",
    sendEmail: true,
  });

  const { data: groupsData } = useQuery<{ groups: UserGroup[] }>({
    queryKey: ["/api/user-management/groups"],
    enabled: open,
  });

  const inviteUserMutation = useMutation({
    mutationFn: async (data: InviteUserData) => {
      const response = await apiRequest("POST", "/api/user-management/invitations", data);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Erro ao enviar convite");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user-management/invitations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user-management/stats"] });
      onOpenChange(false);
      setFormData({
        email: "",
        role: "agent",
        groupIds: [],
        expiresInDays: 7,
        notes: "",
        sendEmail: true,
      });
      toast({
        title: t("userManagement.success", "Sucesso"),
        description: t("userManagement.invitationSent", "Convite enviado com sucesso"),
      });
    },
    onError: (error: any) => {
      toast({
        title: t("userManagement.error", "Erro"),
        description: error.message || t("userManagement.invitationSendError", "Erro ao enviar convite"),
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email.trim()) return;

    inviteUserMutation.mutate(formData);
  };

  const handleGroupToggle = (groupId: string, checked: boolean) => {
    if (checked) {
      setFormData(prev => ({
        ...prev,
        groupIds: [...prev.groupIds, groupId]
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        groupIds: prev.groupIds.filter(id => id !== groupId)
      }));
    }
  };

  const expirationDate = addDays(new Date(), formData.expiresInDays);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Mail className="h-5 w-5" />
              <span>{t("userManagement.inviteUser", "Convidar Usuário")}</span>
            </DialogTitle>
            <DialogDescription>
              {t("userManagement.inviteUserDesc", "Envie um convite por email para um novo usuário")}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="email">{t("userManagement.email", "Email")} *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder={t("userManagement.emailPlaceholder", "usuario@empresa.com")}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">{t("userManagement.role", "Papel")} *</Label>
              <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="customer">{t("userManagement.roles.customer", "Cliente")}</SelectItem>
                  <SelectItem value="agent">{t("userManagement.roles.agent", "Agente")}</SelectItem>
                  <SelectItem value="tenant_admin">{t("userManagement.roles.workspaceAdmin", "Admin do Workspace")}</SelectItem>
                  {!tenantAdmin && (
                    <SelectItem value="saas_admin">{t("userManagement.roles.saasAdmin", "SaaS Admin")}</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="expiresInDays">{t("userManagement.expiration", "Expiração")}</Label>
              <Select 
                value={formData.expiresInDays.toString()} 
                onValueChange={(value) => setFormData({ ...formData, expiresInDays: parseInt(value) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">{t("userManagement.expires1Day", "1 dia")}</SelectItem>
                  <SelectItem value="3">{t("userManagement.expires3Days", "3 dias")}</SelectItem>
                  <SelectItem value="7">{t("userManagement.expires7Days", "7 dias")}</SelectItem>
                  <SelectItem value="14">{t("userManagement.expires14Days", "14 dias")}</SelectItem>
                  <SelectItem value="30">{t("userManagement.expires30Days", "30 dias")}</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground flex items-center">
                <Calendar className="mr-1 h-3 w-3" />
                {t("userManagement.expiresOn", "Expira em")}: {format(expirationDate, "dd/MM/yyyy HH:mm")}
              </p>
            </div>

            {groupsData?.groups && groupsData.groups.length > 0 && (
              <div className="space-y-2">
                <Label>{t("userManagement.groups", "Grupos")} (opcional)</Label>
                <ScrollArea className="h-32 border rounded-md p-3">
                  <div className="space-y-2">
                    {(groupsData?.groups || []).filter(Boolean).map((group) => (
                      <div key={group.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`group-${group.id}`}
                          checked={formData.groupIds.includes(group.id)}
                          onCheckedChange={(checked) => handleGroupToggle(group.id, !!checked)}
                        />
                        <Label htmlFor={`group-${group.id}`} className="flex-1 cursor-pointer text-sm">
                          <div className="font-medium">{group.name}</div>
                          {group.description && (
                            <div className="text-xs text-muted-foreground">{group.description}</div>
                          )}
                        </Label>
                      </div>
                    ))}
                  </div>
                </ScrollArea>

                {formData.groupIds.length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm text-muted-foreground mb-1">Grupos selecionados:</p>
                    <div className="flex flex-wrap gap-1">
                      {formData.groupIds.map((groupId) => {
                        const group = (groupsData?.groups || []).find(g => g?.id === groupId);
                        return group ? (
                          <Badge key={groupId} variant="secondary" className="text-xs">
                            {group.name}
                          </Badge>
                        ) : null;
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="notes">{t("userManagement.notes", "Notas")} (opcional)</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder={t("userManagement.invitationNotesPlaceholder", "Mensagem personalizada para incluir no convite...")}
                rows={3}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="sendEmail"
                checked={formData.sendEmail}
                onCheckedChange={(checked) => setFormData({ ...formData, sendEmail: !!checked })}
              />
              <Label htmlFor="sendEmail" className="text-sm">
                {t("userManagement.sendInvitationEmail", "Enviar email de convite automaticamente")}
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
            >
              {t("common.cancel", "Cancelar")}
            </Button>
            <Button 
              type="submit" 
              disabled={inviteUserMutation.isPending || !formData.email.trim()}
            >
              {inviteUserMutation.isPending 
                ? t("userManagement.sending", "Enviando...") 
                : t("userManagement.sendInvitation", "Enviar Convite")
              }
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}