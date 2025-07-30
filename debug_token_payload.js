// Debug token payload extraction
const sampleToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1NTBlODQwMC1lMjliLTQxZDQtYTcxNi00NDY2NTU0NDAwMDEiLCJlbWFpbCI6ImFsZXhAbGFuc29sdmVyLmNvbSIsInJvbGUiOiJzYWFzX2FkbWluIiwidGVuYW50SWQiOiIzZjk5NDYyZi0zNjIxLTRiMWItYmVhOC03ODJhY2M1MGQ2MmUiLCJ0eXBlIjoiYWNjZXNzIiwiaWF0IjoxNzUzOTA2MzE0LCJleHAiOjE3NTM5OTI3MTQsImlzcyI6ImNvbmR1Y3Rvci1wbGF0Zm9ybSIsImF1ZCI6ImNvbmR1Y3Rvci11c2VycyJ9";

try {
  const payload = JSON.parse(atob(sampleToken.split('.')[1]));
  console.log('🔍 Token payload analysis:');
  console.log('Full payload:', JSON.stringify(payload, null, 2));
  console.log('tenantId field:', payload.tenantId);
  console.log('tenant_id field:', payload.tenant_id);
  console.log('All keys:', Object.keys(payload));
} catch (error) {
  console.error('Token parsing error:', error);
}