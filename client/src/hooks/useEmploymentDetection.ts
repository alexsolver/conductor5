import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { detectEmploymentType, getEmploymentTerminology, type EmploymentType, type TerminologyConfig } from '@/utils/employmentTerminology';

/**
 * Hook for detecting user employment type and providing appropriate terminology
 */
export function useEmploymentDetection() {
  // Fetch current user data
  const { data: currentUser, isLoading } = useQuery({
    queryKey: ['/api/auth/me'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/auth/me');
      return response.json();
    },
    staleTime: 0, // Force fresh fetch for debugging
    cacheTime: 0, // No cache
    refetchOnMount: true,
    refetchOnWindowFocus: true
  });

  // Detect employment type
  const employmentType: EmploymentType = currentUser ? detectEmploymentType(currentUser) : 'clt';
  
  // Debug log for employment detection
  if (currentUser) {
    console.log('[EMPLOYMENT-DEBUG] User data:', {
      email: currentUser.email,
      role: currentUser.role,
      employmentType: currentUser.employmentType,
      detectedType: employmentType
    });
  }
  
  // Get appropriate terminology
  const terminology: TerminologyConfig = getEmploymentTerminology(employmentType);

  return {
    isLoading,
    currentUser,
    employmentType,
    terminology,
    isCLT: employmentType === 'clt',
    isAutonomous: employmentType === 'autonomo',
  };
}