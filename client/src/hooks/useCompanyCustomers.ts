import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  customerType?: string;
  companyName?: string;
  status: string;
  // Associated customers have additional fields
  role?: string;
  isPrimary?: boolean;
  isActive?: boolean;
  memberSince?: string;
}

interface CustomerWithAssociation extends Customer {
  isAssociated: boolean;
  associationStatus?: "active" | "inactive";
}

export function useCompanyCustomers(companyId: string) {
  return useQuery({
    queryKey: ["company-customers", companyId],
    queryFn: async () => {
      try {
        console.log(
          "🔍 [useCompanyCustomers] Fetching customers for company:",
          companyId,
        );

        // Use the correct API endpoint that works
        const response = await apiRequest(
          "GET",
          `/api/companies/${companyId}/customers`,
        );

        const data = await response.json();
        console.log("✅ [useCompanyCustomers] API response:", data);

        // Handle different response formats
        let customers = [];

        if (data.success && data.customers) {
          // Format: { success: true, customers: [...] }
          customers = data.customers;
        } else if (data.success && data.data && Array.isArray(data.data)) {
          // Format: { success: true, data: [...] }
          customers = data.data;
        } else if (Array.isArray(data)) {
          // Direct array format
          customers = data;
        } else if (data.data && Array.isArray(data.data)) {
          // Nested data format
          customers = data.data;
        }

        console.log(
          "🔍 [useCompanyCustomers] Processed customers:",
          customers.length,
        );

        return customers.map((customer: any) => ({
          ...customer,
          isAssociated: true, // All customers from this endpoint are associated
        }));
      } catch (error) {
        console.error("❌ [useCompanyCustomers] Error:", error);
        // Return empty array on error to prevent UI crashes
        return [];
      }
    },
    enabled: !!companyId && companyId !== "",
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}
