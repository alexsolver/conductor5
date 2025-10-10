/**
 * CHAT WEBSOCKET SERVICE
 * Real-time messaging, typing indicators, status updates, queue notifications
 */

import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import { Message } from '../../domain/entities/Message';
import { Chat } from '../../domain/entities/Chat';
import { QueueEntry } from '../../domain/entities/Queue';
import { AgentStatus } from '../../domain/entities/AgentStatus';
import { SLAAlert } from '../../domain/services/SLAMonitoringService';

// ===========================================================================================
// WebSocket Event Types
// ===========================================================================================

export interface ChatWebSocketEvents {
  // Message Events
  'message_sent': MessageSentEvent;
  'message_received': MessageReceivedEvent;
  'message_read': MessageReadEvent;
  'message_edited': MessageEditedEvent;
  'message_deleted': MessageDeletedEvent;
  'reaction_added': ReactionAddedEvent;
  'reaction_removed': ReactionRemovedEvent;

  // Typing Events
  'typing_start': TypingEvent;
  'typing_stop': TypingEvent;

  // Chat Events
  'chat_opened': ChatEvent;
  'chat_closed': ChatEvent;
  'chat_transferred': ChatTransferEvent;
  'participant_joined': ParticipantEvent;
  'participant_left': ParticipantEvent;

  // Queue Events
  'queue_entry_added': QueueEntryEvent;
  'queue_entry_assigned': QueueAssignedEvent;
  'queue_entry_timeout': QueueEntryEvent;
  'queue_position_update': QueuePositionEvent;

  // Agent Status Events
  'agent_status_changed': AgentStatusEvent;
  'agent_available': AgentStatusEvent;
  'agent_busy': AgentStatusEvent;
  'agent_away': AgentStatusEvent;
  'agent_offline': AgentStatusEvent;

  // SLA Events
  'sla_alert': SLAAlertEvent;
  'sla_escalation': SLAAlertEvent;

  // System Events
  'connection_established': ConnectionEvent;
  'error': ErrorEvent;
}

export interface MessageSentEvent {
  messageId: string;
  chatId: string;
  senderId: string;
  senderName: string;
  content: string;
  type: 'text' | 'file' | 'image' | 'system';
  timestamp: string;
}

export interface MessageReceivedEvent extends MessageSentEvent {
  tenantId: string;
  receiverId: string;
}

export interface MessageReadEvent {
  messageId: string;
  chatId: string;
  readByUserId: string;
  readByName: string;
  timestamp: string;
}

export interface MessageEditedEvent {
  messageId: string;
  chatId: string;
  newContent: string;
  editedAt: string;
}

export interface MessageDeletedEvent {
  messageId: string;
  chatId: string;
  deletedAt: string;
}

export interface ReactionAddedEvent {
  messageId: string;
  chatId: string;
  userId: string;
  userName: string;
  emoji: string;
  timestamp: string;
}

export interface ReactionRemovedEvent {
  messageId: string;
  chatId: string;
  userId: string;
  emoji: string;
  timestamp: string;
}

export interface TypingEvent {
  chatId: string;
  userId: string;
  userName: string;
  timestamp: string;
}

export interface ChatEvent {
  chatId: string;
  tenantId: string;
  type: 'direct' | 'group' | 'support';
  status: string;
  timestamp: string;
}

export interface ChatTransferEvent {
  chatId: string;
  fromAgentId?: string;
  toAgentId?: string;
  fromQueueId?: string;
  toQueueId?: string;
  reason?: string;
  timestamp: string;
}

export interface ParticipantEvent {
  chatId: string;
  userId: string;
  userName: string;
  role: string;
  timestamp: string;
}

export interface QueueEntryEvent {
  entryId: string;
  queueId: string;
  queueName: string;
  customerId?: string;
  customerName?: string;
  customerChannel?: string;
  priority: number;
  position?: number;
  waitTime?: number;
  timestamp: string;
}

export interface QueueAssignedEvent extends QueueEntryEvent {
  agentId: string;
  agentName: string;
  chatId: string;
  assignmentReason: string;
}

export interface QueuePositionEvent {
  entryId: string;
  queueId: string;
  position: number;
  estimatedWaitTime: number;
  timestamp: string;
}

export interface AgentStatusEvent {
  userId: string;
  userName: string;
  status: 'available' | 'busy' | 'away' | 'offline';
  currentChatsCount: number;
  maxConcurrentChats: number;
  timestamp: string;
}

export interface SLAAlertEvent {
  alert: SLAAlert;
  timestamp: string;
}

export interface ConnectionEvent {
  tenantId: string;
  userId: string;
  timestamp: string;
}

export interface ErrorEvent {
  code: string;
  message: string;
  timestamp: string;
}

// ===========================================================================================
// WebSocket Client Management
// ===========================================================================================

interface WebSocketClient {
  socket: WebSocket;
  tenantId: string;
  userId: string;
  chatIds: Set<string>;
  queueIds: Set<string>;
  isAgent: boolean;
  lastActivity: Date;
}

export class WebSocketChatService {
  private wss: WebSocketServer | null = null;
  private clients: Map<string, WebSocketClient> = new Map();
  private chatSubscribers: Map<string, Set<string>> = new Map(); // chatId -> Set of clientIds
  private queueSubscribers: Map<string, Set<string>> = new Map(); // queueId -> Set of clientIds
  private typingTimers: Map<string, NodeJS.Timeout> = new Map();

  /**
   * Initialize WebSocket server
   */
  initialize(server: Server) {
    this.wss = new WebSocketServer({ 
      server,
      path: '/ws/chat'
    });

    this.wss.on('connection', (socket: WebSocket, request) => {
      this.handleConnection(socket, request);
    });

    // Cleanup inactive connections every minute
    setInterval(() => this.cleanupInactiveConnections(), 60000);
  }

  /**
   * Handle new WebSocket connection
   */
  private handleConnection(socket: WebSocket, request: any) {
    const clientId = this.generateClientId();
    
    socket.on('message', (data: Buffer) => {
      try {
        const message = JSON.parse(data.toString());
        this.handleMessage(clientId, socket, message);
      } catch (error) {
        this.sendError(socket, 'PARSE_ERROR', 'Invalid message format');
      }
    });

    socket.on('close', () => {
      this.handleDisconnection(clientId);
    });

    socket.on('error', (error) => {
      console.error('WebSocket error:', error);
      this.handleDisconnection(clientId);
    });
  }

  /**
   * Handle incoming messages
   */
  private handleMessage(clientId: string, socket: WebSocket, message: any) {
    switch (message.type) {
      case 'authenticate':
        this.handleAuthentication(clientId, socket, message);
        break;
      
      case 'subscribe_chat':
        this.subscribeToChatjson(clientId, message.chatId);
        break;
      
      case 'unsubscribe_chat':
        this.unsubscribeFromChat(clientId, message.chatId);
        break;
      
      case 'subscribe_queue':
        this.subscribeToQueue(clientId, message.queueId);
        break;
      
      case 'unsubscribe_queue':
        this.unsubscribeFromQueue(clientId, message.queueId);
        break;
      
      case 'typing_start':
        this.handleTypingStart(clientId, message.chatId);
        break;
      
      case 'typing_stop':
        this.handleTypingStop(clientId, message.chatId);
        break;
      
      case 'ping':
        this.handlePing(socket);
        break;
      
      default:
        this.sendError(socket, 'UNKNOWN_TYPE', 'Unknown message type');
    }
  }

  /**
   * Authenticate client
   */
  private handleAuthentication(clientId: string, socket: WebSocket, message: any) {
    const { tenantId, userId, isAgent } = message;

    if (!tenantId || !userId) {
      this.sendError(socket, 'AUTH_ERROR', 'Missing tenantId or userId');
      socket.close();
      return;
    }

    const client: WebSocketClient = {
      socket,
      tenantId,
      userId,
      chatIds: new Set(),
      queueIds: new Set(),
      isAgent: isAgent || false,
      lastActivity: new Date()
    };

    this.clients.set(clientId, client);

    // Send confirmation
    this.send(socket, {
      type: 'connection_established',
      data: { tenantId, userId, timestamp: new Date().toISOString() }
    });
  }

  /**
   * Subscribe to chat updates
   */
  private subscribeToChatjson(clientId: string, chatId: string) {
    const client = this.clients.get(clientId);
    if (!client) return;

    client.chatIds.add(chatId);

    if (!this.chatSubscribers.has(chatId)) {
      this.chatSubscribers.set(chatId, new Set());
    }
    this.chatSubscribers.get(chatId)!.add(clientId);
  }

  /**
   * Unsubscribe from chat
   */
  private unsubscribeFromChat(clientId: string, chatId: string) {
    const client = this.clients.get(clientId);
    if (!client) return;

    client.chatIds.delete(chatId);
    this.chatSubscribers.get(chatId)?.delete(clientId);
  }

  /**
   * Subscribe to queue updates
   */
  private subscribeToQueue(clientId: string, queueId: string) {
    const client = this.clients.get(clientId);
    if (!client) return;

    client.queueIds.add(queueId);

    if (!this.queueSubscribers.has(queueId)) {
      this.queueSubscribers.set(queueId, new Set());
    }
    this.queueSubscribers.get(queueId)!.add(clientId);
  }

  /**
   * Unsubscribe from queue
   */
  private unsubscribeFromQueue(clientId: string, queueId: string) {
    const client = this.clients.get(clientId);
    if (!client) return;

    client.queueIds.delete(queueId);
    this.queueSubscribers.get(queueId)?.delete(clientId);
  }

  /**
   * Handle typing start
   */
  private handleTypingStart(clientId: string, chatId: string) {
    const client = this.clients.get(clientId);
    if (!client) return;

    // Clear existing timer
    const timerKey = `${clientId}-${chatId}`;
    if (this.typingTimers.has(timerKey)) {
      clearTimeout(this.typingTimers.get(timerKey)!);
    }

    // Broadcast typing to chat subscribers
    this.broadcastToChat(chatId, {
      type: 'typing_start',
      data: {
        chatId,
        userId: client.userId,
        userName: 'User', // Should come from user data
        timestamp: new Date().toISOString()
      }
    }, clientId);

    // Auto-stop after 3 seconds
    const timer = setTimeout(() => {
      this.handleTypingStop(clientId, chatId);
    }, 3000);

    this.typingTimers.set(timerKey, timer);
  }

  /**
   * Handle typing stop
   */
  private handleTypingStop(clientId: string, chatId: string) {
    const client = this.clients.get(clientId);
    if (!client) return;

    const timerKey = `${clientId}-${chatId}`;
    if (this.typingTimers.has(timerKey)) {
      clearTimeout(this.typingTimers.get(timerKey)!);
      this.typingTimers.delete(timerKey);
    }

    this.broadcastToChat(chatId, {
      type: 'typing_stop',
      data: {
        chatId,
        userId: client.userId,
        userName: 'User',
        timestamp: new Date().toISOString()
      }
    }, clientId);
  }

  /**
   * Handle ping/pong
   */
  private handlePing(socket: WebSocket) {
    this.send(socket, { type: 'pong', data: { timestamp: new Date().toISOString() } });
  }

  /**
   * Handle disconnection
   */
  private handleDisconnection(clientId: string) {
    const client = this.clients.get(clientId);
    if (!client) return;

    // Remove from chat subscribers
    client.chatIds.forEach(chatId => {
      this.chatSubscribers.get(chatId)?.delete(clientId);
    });

    // Remove from queue subscribers
    client.queueIds.forEach(queueId => {
      this.queueSubscribers.get(queueId)?.delete(clientId);
    });

    // Clear typing timers
    client.chatIds.forEach(chatId => {
      const timerKey = `${clientId}-${chatId}`;
      if (this.typingTimers.has(timerKey)) {
        clearTimeout(this.typingTimers.get(timerKey)!);
        this.typingTimers.delete(timerKey);
      }
    });

    this.clients.delete(clientId);
  }

  // ===========================================================================================
  // Public Broadcasting Methods
  // ===========================================================================================

  /**
   * Broadcast message to specific chat
   */
  broadcastToChat(chatId: string, message: any, excludeClientId?: string) {
    const subscribers = this.chatSubscribers.get(chatId);
    if (!subscribers) return;

    subscribers.forEach(clientId => {
      if (clientId === excludeClientId) return;
      
      const client = this.clients.get(clientId);
      if (client && client.socket.readyState === WebSocket.OPEN) {
        this.send(client.socket, message);
      }
    });
  }

  /**
   * Broadcast to specific queue
   */
  broadcastToQueue(queueId: string, message: any) {
    const subscribers = this.queueSubscribers.get(queueId);
    if (!subscribers) return;

    subscribers.forEach(clientId => {
      const client = this.clients.get(clientId);
      if (client && client.socket.readyState === WebSocket.OPEN) {
        this.send(client.socket, message);
      }
    });
  }

  /**
   * Broadcast to all agents in tenant
   */
  broadcastToAgents(tenantId: string, message: any) {
    this.clients.forEach(client => {
      if (client.tenantId === tenantId && client.isAgent && client.socket.readyState === WebSocket.OPEN) {
        this.send(client.socket, message);
      }
    });
  }

  /**
   * Send to specific user
   */
  sendToUser(userId: string, tenantId: string, message: any) {
    this.clients.forEach(client => {
      if (client.userId === userId && client.tenantId === tenantId && client.socket.readyState === WebSocket.OPEN) {
        this.send(client.socket, message);
      }
    });
  }

  // ===========================================================================================
  // Helper Methods
  // ===========================================================================================

  private send(socket: WebSocket, message: any) {
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(message));
    }
  }

  private sendError(socket: WebSocket, code: string, message: string) {
    this.send(socket, {
      type: 'error',
      data: { code, message, timestamp: new Date().toISOString() }
    });
  }

  private generateClientId(): string {
    return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private cleanupInactiveConnections() {
    const now = Date.now();
    const timeout = 5 * 60 * 1000; // 5 minutes

    this.clients.forEach((client, clientId) => {
      if (now - client.lastActivity.getTime() > timeout) {
        if (client.socket.readyState === WebSocket.OPEN) {
          client.socket.close();
        }
        this.handleDisconnection(clientId);
      }
    });
  }

  /**
   * Get stats
   */
  getStats() {
    return {
      totalClients: this.clients.size,
      agents: Array.from(this.clients.values()).filter(c => c.isAgent).length,
      customers: Array.from(this.clients.values()).filter(c => !c.isAgent).length,
      chatSubscriptions: this.chatSubscribers.size,
      queueSubscriptions: this.queueSubscribers.size,
    };
  }
}

// Singleton instance
export const chatWebSocketService = new WebSocketChatService();
