import { Users, UserCheck, UserPlus, Crown, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useCompanyCustomers } from "@/hooks/useCompanyCustomers";

interface CompanyCustomersSectionProps {
  companyId: string;
  onAssociateCustomers: () => void;
}

export default function CompanyCustomersSection({
  companyId,
  onAssociateCustomers,
  customersData,
}: CompanyCustomersSectionProps) {
  // 🎯 [1QA-COMPLIANCE] Properly destructure from useQuery result
  const {
    data: allCustomers,
    isLoading,
    error,
  } = useCompanyCustomers(companyId);

  if (isLoading) {
    return (
      <div className="space-y-3 pt-3 border-t">
        <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
        <div className="space-y-2">
          <div className="h-3 bg-gray-200 rounded w-full animate-pulse"></div>
          <div className="h-3 bg-gray-200 rounded w-3/4 animate-pulse"></div>
        </div>
      </div>
    );
  }

  if (error) {
    console.warn("CompanyCustomersSection error:", error);
  }

  // 🎯 [1QA-COMPLIANCE] Defensive programming - proteger contra undefined
  const safeCustomers = Array.isArray(allCustomers) ? allCustomers : [];
  const associatedCount = safeCustomers.filter(
    (c: any) => c.isAssociated,
  ).length;
  let availableCount = 0;
  if (customersData?.customers && Array.isArray(customersData.customers)) {
    availableCount = customersData.customers.length - associatedCount;
  }

  return (
    <div className="space-y-3 pt-3 border-t">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-blue-600" />
          <span className="text-sm font-medium text-gray-700">
            Clientes ({safeCustomers.length})
          </span>
        </div>
        <div className="flex gap-1">
          <Badge
            variant="outline"
            className="text-xs px-2 py-0 text-green-700 border-green-300"
          >
            {associatedCount} associados
          </Badge>
          <Badge
            variant="outline"
            className="text-xs px-2 py-0 text-blue-700 border-blue-300"
          >
            {availableCount} disponíveis
          </Badge>
        </div>
      </div>

      {/* Simplified Customer Display */}
      <div className="text-center py-2">
        <div className="text-sm text-gray-600">
          {associatedCount > 0 ? (
            <span className="font-medium text-green-700">
              {associatedCount} cliente{associatedCount !== 1 ? "s" : ""}{" "}
              associado{associatedCount !== 1 ? "s" : ""}
            </span>
          ) : (
            <span className="text-gray-500">Nenhum cliente associado</span>
          )}
        </div>
      </div>

      {/* Action Button */}
      <div className="mt-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onAssociateCustomers}
          className="text-blue-600 hover:text-blue-700 h-8 text-xs w-full"
        >
          <UserCheck className="w-3 h-3 mr-1" />
          Gerenciar Clientes
        </Button>
      </div>
    </div>
  );
}
