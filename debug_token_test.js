
// Script para verificar e definir token para teste
const currentToken = localStorage.getItem('accessToken');
console.log('Token atual:', currentToken ? 'existe' : 'não existe');

// Se não tiver token, usar um dos tokens que vi nos arquivos
if (!currentToken) {
  const testToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1NTBlODQwMC1lMjliLTQxZDQtYTcxNi00NDY2NTU0NDAwMDIiLCJlbWFpbCI6ImFkbWluQGNvbmR1Y3Rvci5jb20iLCJyb2xlIjoidGVuYW50X2FkbWluIiwidGVuYW50SWQiOiIzZjk5NDYyZi0zNjIxLTRiMWItYmVhOC03ODJhY2M1MGQ2MmUiLCJ0eXBlIjoiYWNjZXNzIiwiaWF0IjoxNzUzNjYwMTM1LCJleHAiOjE3NTM3NDY1MzUsImF1ZCI6ImNvbmR1Y3Rvci11c2VycyIsImlzcyI6ImNvbmR1Y3Rvci1wbGF0Zm9ybSJ9.5ZVykMIbj0Lq_vm3h_jicIUBxZoI6rJO-BhCL-pjb5Q";
  
  localStorage.setItem('accessToken', testToken);
  console.log('Token de teste definido');
  console.log('Recarregue a página para testar');
} else {
  console.log('Token já existe, length:', currentToken.length);
}
