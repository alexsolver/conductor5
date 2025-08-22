
import { Router, Request, Response } from 'express';
import { jwtAuth } from '../middleware/jwtAuth';

const router = Router();

// Map para armazenar conexões SSE ativas
const activeConnections = new Map<string, Set<Response>>();

// Endpoint para conexões Server-Sent Events
router.get('/sse', jwtAuth, (req: Request, res: Response) => {
  const tenantId = req.user?.tenantId;
  
  if (!tenantId) {
    return res.status(401).json({ error: 'Tenant ID required' });
  }

  // Configurar headers SSE
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Cache-Control'
  });

  // Adicionar conexão ao mapa
  if (!activeConnections.has(tenantId)) {
    activeConnections.set(tenantId, new Set());
  }
  activeConnections.get(tenantId)!.add(res);

  // Enviar evento de conexão estabelecida
  res.write(`data: ${JSON.stringify({
    type: 'connected',
    timestamp: new Date().toISOString(),
    message: 'Notificações em tempo real ativadas'
  })}\n\n`);

  console.log(`🔗 [SSE] New connection from tenant ${tenantId}`);

  // Heartbeat para manter conexão viva
  const heartbeat = setInterval(() => {
    res.write(`data: ${JSON.stringify({
      type: 'heartbeat',
      timestamp: new Date().toISOString()
    })}\n\n`);
  }, 30000);

  // Cleanup ao fechar conexão
  req.on('close', () => {
    clearInterval(heartbeat);
    
    const connections = activeConnections.get(tenantId);
    if (connections) {
      connections.delete(res);
      
      if (connections.size === 0) {
        activeConnections.delete(tenantId);
      }
    }
    
    console.log(`🔗 [SSE] Connection closed for tenant ${tenantId}`);
  });
});

// Função para enviar notificação para todos os clientes conectados de um tenant
export function broadcastToTenant(tenantId: string, notification: any): void {
  const connections = activeConnections.get(tenantId);
  
  if (connections && connections.size > 0) {
    const payload = {
      type: 'notification',
      data: notification,
      timestamp: new Date().toISOString()
    };

    const disconnectedConnections: Response[] = [];

    connections.forEach(res => {
      try {
        res.write(`data: ${JSON.stringify(payload)}\n\n`);
      } catch (error) {
        console.error('🔗 [SSE] Failed to send to connection:', error);
        disconnectedConnections.push(res);
      }
    });

    // Remove conexões que falharam
    disconnectedConnections.forEach(res => connections.delete(res));

    console.log(`🔗 [SSE] Broadcasted notification to ${connections.size} clients for tenant ${tenantId}`);
  }
}

// Função para obter estatísticas de conexões
export function getConnectionStats(): { [tenantId: string]: number } {
  const stats: { [tenantId: string]: number } = {};
  
  activeConnections.forEach((connections, tenantId) => {
    stats[tenantId] = connections.size;
  });
  
  return stats;
}

export default router;
