import { FileCheck } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { useTranslation } from "react-i18next";

interface ApprovalRequestModalProps {
  ticketId: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function ApprovalRequestModal({ ticketId, isOpen, onClose }: ApprovalRequestModalProps) {
  const { t } = useTranslation();
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileCheck className="w-5 h-5" />
            {t('approvals.title')}
          </DialogTitle>
          <DialogDescription>
            {t('approvals.development_description')}
          </DialogDescription>
        </DialogHeader>

        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileCheck className="w-16 h-16 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {t('approvals.under_development')}
            </h3>
            <p className="text-center text-gray-500 mb-6">
              {t('approvals.development_message')}
            </p>
            <div className="space-y-2 text-sm text-gray-600">
              <p><strong>{t('approvals.planned_features')}:</strong></p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>{t('approvals.features.custom_workflows')}</li>
                <li>{t('approvals.features.approvers_by_category')}</li>
                <li>{t('approvals.features.automatic_notifications')}</li>
                <li>{t('approvals.features.approval_history')}</li>
                <li>{t('approvals.features.email_integration')}</li>
                <li>{t('approvals.features.approval_reports')}</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
}