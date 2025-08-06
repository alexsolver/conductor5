export type EmploymentType = 'clt' | 'autonomo';

export function detectEmploymentType(user: any): EmploymentType {
  console.log('[EMPLOYMENT-DETECTION] Input user:', {
    email: user?.email,
    role: user?.role,
    employmentType: user?.employmentType,
    position: user?.position
  });

  // Check if user has employmentType field (primary detection)
  if (user?.employmentType) {
    const detected = user.employmentType === 'autonomo' ? 'autonomo' : 'clt';
    console.log('[EMPLOYMENT-DETECTION] Using employmentType field:', detected);
    return detected;
  }
  
  // Fallback detection logic
  // Could be based on role, department, or other criteria
  if (user?.role === 'contractor' || user?.position?.toLowerCase().includes('freelancer')) {
    console.log('[EMPLOYMENT-DETECTION] Using fallback logic: autonomo');
    return 'autonomo';
  }
  
  // Default to CLT
  console.log('[EMPLOYMENT-DETECTION] Using default: clt');
  return 'clt';
}