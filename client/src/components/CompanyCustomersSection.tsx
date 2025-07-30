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
  onAssociateCustomers 
}: CompanyCustomersSectionProps) {
  const { allCustomers, isLoading } = useCompanyCustomers(companyId);

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

  const associatedCount = allCustomers.filter(c => c.isAssociated).length;
  const availableCount = allCustomers.filter(c => !c.isAssociated).length;

  return (
    <div className="space-y-3 pt-3 border-t">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-blue-600" />
          <span className="text-sm font-medium text-gray-700">
            Clientes ({allCustomers.length})
          </span>
        </div>
        <div className="flex gap-1">
          <Badge variant="outline" className="text-xs px-2 py-0 text-green-700 border-green-300">
            {associatedCount} associados
          </Badge>
          <Badge variant="outline" className="text-xs px-2 py-0 text-blue-700 border-blue-300">
            {availableCount} disponíveis
          </Badge>
        </div>
      </div>

      {/* All Customers List */}
      {allCustomers.length > 0 ? (
        <div className="space-y-1 max-h-32 overflow-y-auto">
          {allCustomers.slice(0, 6).map((customer) => (
            <div key={customer.id} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                {customer.isAssociated ? (
                  <CheckCircle2 className="w-3 h-3 text-green-600 flex-shrink-0" />
                ) : (
                  <div className="w-3 h-3 border border-gray-300 rounded-full flex-shrink-0" />
                )}
                <span className={`truncate ${customer.isAssociated ? 'text-green-700 font-medium' : 'text-gray-600'}`}>
                  {customer.firstName} {customer.lastName}
                </span>
                {customer.isPrimary && (
                  <Crown className="w-3 h-3 text-yellow-500 flex-shrink-0" />
                )}
              </div>
              <div className="flex items-center gap-1">
                {customer.isAssociated && (
                  <Badge 
                    variant="outline" 
                    className={`text-xs px-1 py-0 ${
                      customer.associationStatus === 'active' 
                        ? 'text-green-700 border-green-300 bg-green-50' 
                        : 'text-gray-500 border-gray-300'
                    }`}
                  >
                    {customer.associationStatus === 'active' ? 'Ativo' : 'Inativo'}
                  </Badge>
                )}
              </div>
            </div>
          ))}
          {allCustomers.length > 6 && (
            <div className="text-xs text-gray-500 mt-1 text-center">
              +{allCustomers.length - 6} outros clientes
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-4">
          <Users className="w-8 h-8 mx-auto text-gray-400 mb-2" />
          <p className="text-xs text-gray-500 mb-2">
            Nenhum cliente cadastrado
          </p>
        </div>
      )}

      {/* Action Button */}
      {availableCount > 0 && (
        <Button
          variant="outline"
          size="sm"
          onClick={onAssociateCustomers}
          className="text-blue-600 hover:text-blue-700 mt-2 h-8 text-xs w-full"
        >
          <UserPlus className="w-3 h-3 mr-1" />
          Associar Clientes ({availableCount} disponíveis)
        </Button>
      )}

      {availableCount === 0 && allCustomers.length > 0 && (
        <div className="text-center mt-2">
          <Badge variant="outline" className="text-xs px-2 py-1 text-green-700 border-green-300 bg-green-50">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Todos os clientes associados
          </Badge>
        </div>
      )}
    </div>
  );
}