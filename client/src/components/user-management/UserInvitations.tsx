import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Mail, RefreshCw, X, Copy } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface UserInvitation {
  id: string;
  email: string;
  role: string;
  groupIds?: string[];
  status: "pending" | "accepted" | "expired" | "revoked";
  token: string;
  expiresAt: string;
  invitedAt: string;
  acceptedAt?: string;
  notes?: string;
  invitedByUser?: { firstName?: string; lastName?: string; email: string };
}

interface UserInvitationsProps {
  tenantAdmin?: boolean;
}

export function UserInvitations({ tenantAdmin = false }: UserInvitationsProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: invitationsData, isLoading } = useQuery<{ invitations: UserInvitation[] }>({
    queryKey: ["/api/user-management/invitations"],
  });

  const resendInvitationMutation = useMutation({
    mutationFn: async (invitationId: string) => {
      return apiRequest("POST", `/api/user-management/invitations/${invitationId}/resend`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user-management/invitations"] });
      toast({
        title: t("userManagement.success", "Sucesso"),
        description: t("userManagement.invitationResent", "Convite reenviado com sucesso"),
      });
    },
    onError: () => {
      toast({
        title: t("userManagement.error", "Erro"),
        description: t("userManagement.invitationResendError", "Erro ao reenviar convite"),
        variant: "destructive",
      });
    },
  });

  const revokeInvitationMutation = useMutation({
    mutationFn: async (invitationId: string) => {
      return apiRequest("POST", `/api/user-management/invitations/${invitationId}/revoke`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user-management/invitations"] });
      toast({
        title: t("userManagement.success", "Sucesso"),
        description: t("userManagement.invitationRevoked", "Convite revogado com sucesso"),
      });
    },
    onError: () => {
      toast({
        title: t("userManagement.error", "Erro"),
        description: t("userManagement.invitationRevokeError", "Erro ao revogar convite"),
        variant: "destructive",
      });
    },
  });

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'pending':
        return 'default';
      case 'accepted':
        return 'default';
      case 'expired':
        return 'secondary';
      case 'revoked':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const getStatusDisplayName = (status: string) => {
    const statusNames: Record<string, string> = {
      'pending': 'Pendente',
      'accepted': 'Aceito',
      'expired': 'Expirado',
      'revoked': 'Revogado'
    };
    return statusNames[status] || status;
  };

  const getRoleDisplayName = (role: string) => {
    const roleNames: Record<string, string> = {
      'saas_admin': 'SaaS Admin',
      'tenant_admin': 'Admin do Tenant',
      'agent': 'Agente',
      'customer': 'Cliente'
    };
    return roleNames[role] || role;
  };

  const copyInvitationLink = (token: string) => {
    const invitationUrl = `${window.location.origin}/accept-invitation?token=${token}`;
    navigator.clipboard.writeText(invitationUrl);
    toast({
      title: t("userManagement.success", "Sucesso"),
      description: t("userManagement.invitationLinkCopied", "Link do convite copiado para a área de transferência"),
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-medium">{t("userManagement.userInvitations", "Convites de Usuários")}</h3>
        <p className="text-sm text-muted-foreground">
          {t("userManagement.userInvitationsDesc", "Gerencie convites pendentes e aceitos")}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("userManagement.invitationsList", "Lista de Convites")}</CardTitle>
          <CardDescription>
            {t("userManagement.invitationsListDesc", "Visualize e gerencie convites enviados para novos usuários")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              {t("common.loading", "Carregando...")}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("userManagement.email", "Email")}</TableHead>
                  <TableHead>{t("userManagement.role", "Papel")}</TableHead>
                  <TableHead>{t("userManagement.status", "Status")}</TableHead>
                  <TableHead>{t("userManagement.invitedBy", "Convidado por")}</TableHead>
                  <TableHead>{t("userManagement.invitedAt", "Data do Convite")}</TableHead>
                  <TableHead>{t("userManagement.expiresAt", "Expira em")}</TableHead>
                  <TableHead className="text-right">{t("common.actions", "Ações")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invitationsData?.invitations?.map((invitation) => (
                  <TableRow key={invitation.id}>
                    <TableCell className="font-medium">
                      {invitation.email}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {getRoleDisplayName(invitation.role)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(invitation.status)}>
                        {getStatusDisplayName(invitation.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {invitation.invitedByUser 
                        ? `${invitation.invitedByUser.firstName || ''} ${invitation.invitedByUser.lastName || ''}`.trim() || invitation.invitedByUser.email
                        : t("userManagement.system", "Sistema")
                      }
                    </TableCell>
                    <TableCell>
                      {format(new Date(invitation.invitedAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                    </TableCell>
                    <TableCell>
                      {format(new Date(invitation.expiresAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {invitation.status === 'pending' && (
                            <>
                              <DropdownMenuItem 
                                onClick={() => resendInvitationMutation.mutate(invitation.id)}
                              >
                                <Mail className="mr-2 h-4 w-4" />
                                {t("userManagement.resendInvitation", "Reenviar")}
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => copyInvitationLink(invitation.token)}
                              >
                                <Copy className="mr-2 h-4 w-4" />
                                {t("userManagement.copyLink", "Copiar link")}
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => revokeInvitationMutation.mutate(invitation.id)}
                                className="text-destructive"
                              >
                                <X className="mr-2 h-4 w-4" />
                                {t("userManagement.revokeInvitation", "Revogar")}
                              </DropdownMenuItem>
                            </>
                          )}
                          {invitation.status === 'expired' && (
                            <DropdownMenuItem 
                              onClick={() => resendInvitationMutation.mutate(invitation.id)}
                            >
                              <RefreshCw className="mr-2 h-4 w-4" />
                              {t("userManagement.renewInvitation", "Renovar")}
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {invitationsData?.invitations?.length === 0 && (
            <div className="text-center py-8">
              <Mail className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {t("userManagement.noInvitations", "Nenhum convite foi enviado ainda")}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Statistics */}
      {invitationsData?.invitations && invitationsData.invitations.length > 0 && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-orange-600">
                {invitationsData.invitations.filter(i => i.status === 'pending').length}
              </div>
              <p className="text-xs text-muted-foreground">
                {t("userManagement.pendingInvitations", "Convites Pendentes")}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-green-600">
                {invitationsData.invitations.filter(i => i.status === 'accepted').length}
              </div>
              <p className="text-xs text-muted-foreground">
                {t("userManagement.acceptedInvitations", "Convites Aceitos")}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-gray-600">
                {invitationsData.invitations.filter(i => i.status === 'expired').length}
              </div>
              <p className="text-xs text-muted-foreground">
                {t("userManagement.expiredInvitations", "Convites Expirados")}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-red-600">
                {invitationsData.invitations.filter(i => i.status === 'revoked').length}
              </div>
              <p className="text-xs text-muted-foreground">
                {t("userManagement.revokedInvitations", "Convites Revogados")}
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}