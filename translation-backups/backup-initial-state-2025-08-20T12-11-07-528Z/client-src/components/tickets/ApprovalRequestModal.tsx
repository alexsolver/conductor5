import { FileCheck } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";

interface ApprovalRequestModalProps {
  ticketId: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function ApprovalRequestModal({ ticketId, isOpen, onClose }: ApprovalRequestModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileCheck className="w-5 h-5" />
            Pedidos de Aprovação
          </DialogTitle>
          <DialogDescription>
            Módulo em desenvolvimento - Gerenciamento de fluxos de aprovação para tickets.
          </DialogDescription>
        </DialogHeader>

        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileCheck className="w-16 h-16 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Módulo em Desenvolvimento
            </h3>
            <p className="text-center text-gray-500 mb-6">
              O sistema de pedidos de aprovação está sendo desenvolvido e será disponibilizado em breve.
            </p>
            <div className="space-y-2 text-sm text-gray-600">
              <p><strong>Funcionalidades planejadas:</strong></p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Criação de fluxos de aprovação personalizados</li>
                <li>Definição de aprovadores por categoria ou valor</li>
                <li>Notificações automáticas para aprovadores</li>
                <li>Histórico de aprovações e rejeições</li>
                <li>Integração com sistema de e-mails</li>
                <li>Relatórios de tempo de aprovação</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
}