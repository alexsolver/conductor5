/**
 * DOMAIN LAYER - AGENT STATUS ENTITY
 * Seguindo Clean Architecture - Agent Availability & Status
 */

export type AgentStatusType = "available" | "busy" | "away" | "offline";

export interface AgentStatus {
  id: string;
  tenantId: string;
  userId: string;
  status: AgentStatusType;
  currentChatsCount: number;
  maxConcurrentChats: number;
  lastStatusChange: Date;
  lastActivityAt: Date;
  metadata?: Record<string, any>;
  updatedAt: Date;
}

export class AgentStatusDomainService {
  /**
   * Check if agent can accept new chats
   */
  canAcceptChat(agentStatus: AgentStatus): boolean {
    if (agentStatus.status !== 'available') {
      return false;
    }

    return agentStatus.currentChatsCount < agentStatus.maxConcurrentChats;
  }

  /**
   * Calculate agent capacity percentage
   */
  calculateCapacity(agentStatus: AgentStatus): number {
    if (agentStatus.maxConcurrentChats === 0) {
      return 0;
    }

    return (agentStatus.currentChatsCount / agentStatus.maxConcurrentChats) * 100;
  }

  /**
   * Check if agent is idle (available but no chats)
   */
  isIdle(agentStatus: AgentStatus): boolean {
    return agentStatus.status === 'available' && agentStatus.currentChatsCount === 0;
  }

  /**
   * Check if agent is at capacity
   */
  isAtCapacity(agentStatus: AgentStatus): boolean {
    return agentStatus.currentChatsCount >= agentStatus.maxConcurrentChats;
  }

  /**
   * Update status
   */
  updateStatus(agentStatus: AgentStatus, newStatus: AgentStatusType): AgentStatus {
    return {
      ...agentStatus,
      status: newStatus,
      lastStatusChange: new Date(),
      updatedAt: new Date()
    };
  }

  /**
   * Increment chat count
   */
  incrementChats(agentStatus: AgentStatus): AgentStatus {
    return {
      ...agentStatus,
      currentChatsCount: agentStatus.currentChatsCount + 1,
      status: agentStatus.currentChatsCount + 1 >= agentStatus.maxConcurrentChats ? 'busy' : 'available',
      lastActivityAt: new Date(),
      updatedAt: new Date()
    };
  }

  /**
   * Decrement chat count
   */
  decrementChats(agentStatus: AgentStatus): AgentStatus {
    const newCount = Math.max(0, agentStatus.currentChatsCount - 1);
    
    return {
      ...agentStatus,
      currentChatsCount: newCount,
      status: newCount < agentStatus.maxConcurrentChats ? 'available' : 'busy',
      lastActivityAt: new Date(),
      updatedAt: new Date()
    };
  }
}
