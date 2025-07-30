// Create a simple test to set localStorage values
console.log('Setting test localStorage values...');

// Simulate a successful login
const mockToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1NTBlODQwMC1lMjliLTQxZDQtYTcxNi00NDY2NTU0NDAwMDEiLCJlbWFpbCI6ImFsZXhAbGFuc29sdmVyLmNvbSIsInJvbGUiOiJzYWFzX2FkbWluIiwidGVuYW50SWQiOiIzZjk5NDYyZi0zNjIxLTRiMWItYmVhOC03ODJhY2M1MGQ2MmUiLCJ0eXBlIjoiYWNjZXNzIiwiaWF0IjoxNzUzOTA2MzE0LCJleHAiOjE3NTM5OTI3MTQsImlzcyI6ImNvbmR1Y3Rvci1wbGF0Zm9ybSIsImF1ZCI6ImNvbmR1Y3Rvci11c2VycyJ9.T9PH5cEXNcC9dpozAa8cPSAI8TjXCTcJBOj9Ty3LPmM";
const mockTenantId = "3f99462f-3621-4b1b-bea8-782acc50d62e";

console.log('Mock token:', mockToken.substring(0, 50) + '...');
console.log('Mock tenantId:', mockTenantId);

// This would be executed in browser context
console.log('Instructions for browser:');
console.log('localStorage.setItem("accessToken", "' + mockToken + '");');
console.log('localStorage.setItem("tenantId", "' + mockTenantId + '");');