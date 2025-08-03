import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useEmploymentDetection } from '@/hooks/useEmploymentDetection';
import { getEmploymentRoute } from '@/utils/employmentTerminology';

interface EmploymentRouteGuardProps {
  children: React.ReactNode;
  requiredType?: 'clt' | 'autonomo' | 'any';
}

/**
 * Route guard that redirects users to appropriate timecard interface
 * based on their employment type
 */
export function EmploymentRouteGuard({ children, requiredType = 'any' }: EmploymentRouteGuardProps) {
  const { employmentType, isLoading } = useEmploymentDetection();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (isLoading) return;

    // If accessing CLT timecard route but user is autonomous
    if (window.location.pathname.startsWith('/timecard') && 
        !window.location.pathname.startsWith('/timecard-autonomous') &&
        employmentType === 'autonomo') {
      const appropriateRoute = getEmploymentRoute('autonomo', 'main');
      setLocation(appropriateRoute);
      return;
    }

    // If accessing autonomous timecard route but user is CLT
    if (window.location.pathname.startsWith('/timecard-autonomous') && 
        employmentType === 'clt') {
      const appropriateRoute = getEmploymentRoute('clt', 'main');
      setLocation(appropriateRoute);
      return;
    }

    // Check specific type requirements
    if (requiredType !== 'any' && requiredType !== employmentType) {
      const appropriateRoute = getEmploymentRoute(employmentType, 'main');
      setLocation(appropriateRoute);
      return;
    }
  }, [employmentType, isLoading, setLocation, requiredType]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-500">Verificando tipo de vínculo...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}