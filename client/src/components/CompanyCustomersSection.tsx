import { Users, UserCheck, UserPlus, Crown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useCompanyCustomers } from "@/hooks/useCompanyCustomers";

interface CompanyCustomersSectionProps {
  companyId: string;
  onAssociateCustomers: () => void;
}

export default function CompanyCustomersSection({ 
  companyId, 
  onAssociateCustomers 
}: CompanyCustomersSectionProps) {
  const { availableCustomers, associatedCustomers, isLoading } = useCompanyCustomers(companyId);

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

  return (
    <div className="space-y-3 pt-3 border-t">
      {/* Associated Customers Section */}
      {associatedCustomers.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <UserCheck className="w-4 h-4 text-green-600" />
            <span className="text-sm font-medium text-gray-700">
              Clientes Associados ({associatedCustomers.length})
            </span>
          </div>
          <div className="space-y-1">
            {associatedCustomers.slice(0, 3).map((customer) => (
              <div key={customer.id} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1">
                  {customer.isPrimary && (
                    <Crown className="w-3 h-3 text-yellow-500" />
                  )}
                  <span className="text-gray-600">
                    {customer.firstName} {customer.lastName}
                  </span>
                </div>
                <Badge 
                  variant="outline" 
                  className={`text-xs px-1 py-0 ${
                    customer.isActive ? 'text-green-700 border-green-300' : 'text-gray-500 border-gray-300'
                  }`}
                >
                  {customer.isActive ? 'Ativo' : 'Inativo'}
                </Badge>
              </div>
            ))}
            {associatedCustomers.length > 3 && (
              <div className="text-xs text-gray-500 mt-1">
                +{associatedCustomers.length - 3} outros clientes
              </div>
            )}
          </div>
        </div>
      )}

      {/* Available Customers Section */}
      {availableCustomers.length > 0 && (
        <>
          {associatedCustomers.length > 0 && <Separator className="my-2" />}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <UserPlus className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-gray-700">
                Disponíveis para Associação ({availableCustomers.length})
              </span>
            </div>
            <div className="space-y-1">
              {availableCustomers.slice(0, 2).map((customer) => (
                <div key={customer.id} className="text-xs text-gray-600">
                  {customer.firstName} {customer.lastName}
                </div>
              ))}
              {availableCustomers.length > 2 && (
                <div className="text-xs text-gray-500">
                  +{availableCustomers.length - 2} outros disponíveis
                </div>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={onAssociateCustomers}
              className="text-blue-600 hover:text-blue-700 mt-2 h-8 text-xs"
            >
              <UserPlus className="w-3 h-3 mr-1" />
              Associar Clientes
            </Button>
          </div>
        </>
      )}

      {/* Empty State */}
      {associatedCustomers.length === 0 && availableCustomers.length === 0 && (
        <div className="text-center py-4">
          <Users className="w-8 h-8 mx-auto text-gray-400 mb-2" />
          <p className="text-xs text-gray-500 mb-2">
            Nenhum cliente associado
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={onAssociateCustomers}
            className="text-blue-600 hover:text-blue-700 h-8 text-xs"
          >
            <UserPlus className="w-3 h-3 mr-1" />
            Associar Primeiro Cliente
          </Button>
        </div>
      )}

      {/* Only associated customers, no available ones */}
      {associatedCustomers.length > 0 && availableCustomers.length === 0 && (
        <div className="mt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onAssociateCustomers}
            className="text-blue-600 hover:text-blue-700 h-8 text-xs w-full"
            disabled
          >
            <UserCheck className="w-3 h-3 mr-1" />
            Todos os Clientes Associados
          </Button>
        </div>
      )}
    </div>
  );
}