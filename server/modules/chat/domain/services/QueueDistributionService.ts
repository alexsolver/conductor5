/**
 * QUEUE DISTRIBUTION SERVICE
 * Implements 5 queue distribution strategies:
 * 1. FIFO (First In, First Out)
 * 2. Priority-based
 * 3. Skill-based routing
 * 4. Round-robin
 * 5. Least Busy
 */

import { Queue, QueueEntry, QueueMember, QueueStrategy } from '../entities/Queue';
import { AgentStatus } from '../entities/AgentStatus';

export interface DistributionContext {
  queue: Queue;
  entry: QueueEntry;
  availableAgents: QueueMember[];
  agentStatuses: AgentStatus[];
  lastAssignedAgentId?: string; // For round-robin
}

export interface DistributionResult {
  agentId: string | null;
  reason: string;
}

export class QueueDistributionService {
  /**
   * Main distribution method - routes to appropriate strategy
   */
  async distribute(context: DistributionContext): Promise<DistributionResult> {
    // Filter only agents who can accept chats
    const eligibleAgents = context.availableAgents.filter(member => {
      const status = context.agentStatuses.find(s => s.userId === member.userId);
      if (!status) return false;
      
      return (
        status.status === 'available' &&
        status.currentChatsCount < status.maxConcurrentChats &&
        member.isActive
      );
    });

    if (eligibleAgents.length === 0) {
      return {
        agentId: null,
        reason: 'No available agents'
      };
    }

    const strategy = context.queue.strategy;

    switch (strategy) {
      case 'fifo':
        return this.fifoStrategy(eligibleAgents);
      
      case 'priority':
        return this.priorityStrategy(context, eligibleAgents);
      
      case 'skill_based':
        return this.skillBasedStrategy(context, eligibleAgents);
      
      case 'round_robin':
        return this.roundRobinStrategy(context, eligibleAgents);
      
      case 'least_busy':
        return this.leastBusyStrategy(context, eligibleAgents);
      
      default:
        return this.fifoStrategy(eligibleAgents);
    }
  }

  /**
   * Strategy 1: FIFO (First In, First Out)
   * Assigns to first available agent in the list
   */
  private fifoStrategy(agents: QueueMember[]): DistributionResult {
    const agent = agents[0];
    return {
      agentId: agent.userId,
      reason: 'FIFO - First available agent'
    };
  }

  /**
   * Strategy 2: Priority-based
   * Assigns to agent with highest priority score
   */
  private priorityStrategy(
    context: DistributionContext,
    agents: QueueMember[]
  ): DistributionResult {
    // Sort by agent priority (higher first)
    const sorted = [...agents].sort((a, b) => b.priority - a.priority);
    
    const agent = sorted[0];
    return {
      agentId: agent.userId,
      reason: `Priority - Agent priority: ${agent.priority}`
    };
  }

  /**
   * Strategy 3: Skill-based routing
   * Matches agent skills with required skills
   */
  private skillBasedStrategy(
    context: DistributionContext,
    agents: QueueMember[]
  ): DistributionResult {
    const requiredSkills = context.queue.skills || [];
    
    if (requiredSkills.length === 0) {
      // No skills required, fallback to FIFO
      return this.fifoStrategy(agents);
    }

    // Score agents based on skill match
    const scoredAgents = agents.map(agent => {
      const agentSkills = agent.skills || [];
      const matchedSkills = requiredSkills.filter(skill => 
        agentSkills.includes(skill)
      );
      
      return {
        agent,
        score: matchedSkills.length,
        matchRate: matchedSkills.length / requiredSkills.length
      };
    });

    // Sort by match rate (highest first)
    scoredAgents.sort((a, b) => b.score - a.score);

    const best = scoredAgents[0];
    
    if (best.score === 0) {
      // No agent has required skills, assign to first available
      return {
        agentId: agents[0].userId,
        reason: 'Skill-based - No exact match, fallback to first available'
      };
    }

    return {
      agentId: best.agent.userId,
      reason: `Skill-based - ${best.score}/${requiredSkills.length} skills matched (${Math.round(best.matchRate * 100)}%)`
    };
  }

  /**
   * Strategy 4: Round-robin
   * Distributes evenly among all agents
   */
  private roundRobinStrategy(
    context: DistributionContext,
    agents: QueueMember[]
  ): DistributionResult {
    if (!context.lastAssignedAgentId) {
      // First assignment
      return {
        agentId: agents[0].userId,
        reason: 'Round-robin - First assignment'
      };
    }

    // Find next agent after last assigned
    const lastIndex = agents.findIndex(a => a.userId === context.lastAssignedAgentId);
    
    let nextIndex: number;
    if (lastIndex === -1 || lastIndex === agents.length - 1) {
      // Last agent not found or was the last one, go to first
      nextIndex = 0;
    } else {
      // Next agent
      nextIndex = lastIndex + 1;
    }

    const agent = agents[nextIndex];
    return {
      agentId: agent.userId,
      reason: `Round-robin - Position ${nextIndex + 1}/${agents.length}`
    };
  }

  /**
   * Strategy 5: Least Busy
   * Assigns to agent with fewest active chats
   */
  private leastBusyStrategy(
    context: DistributionContext,
    agents: QueueMember[]
  ): DistributionResult {
    // Sort by current chat count (lowest first)
    const sorted = [...agents].sort((a, b) => {
      const statusA = context.agentStatuses.find(s => s.userId === a.userId);
      const statusB = context.agentStatuses.find(s => s.userId === b.userId);
      
      const countA = statusA?.currentChatsCount || 0;
      const countB = statusB?.currentChatsCount || 0;
      
      return countA - countB;
    });

    const agent = sorted[0];
    const status = context.agentStatuses.find(s => s.userId === agent.userId);
    const currentChats = status?.currentChatsCount || 0;

    return {
      agentId: agent.userId,
      reason: `Least Busy - ${currentChats} active chats`
    };
  }

  /**
   * Calculate estimated wait time based on queue state
   */
  calculateEstimatedWaitTime(
    queueEntries: QueueEntry[],
    availableAgents: number,
    avgHandlingTime: number = 600 // 10 minutes default
  ): number {
    const waitingCount = queueEntries.filter(e => e.status === 'waiting').length;
    
    if (availableAgents === 0) {
      return -1; // Unknown
    }

    // Estimated wait = (waiting customers / available agents) * avg handling time
    const estimated = Math.ceil((waitingCount / availableAgents) * avgHandlingTime);
    return estimated;
  }

  /**
   * Determine if escalation is needed
   */
  shouldEscalate(entry: QueueEntry, maxWaitTime: number): boolean {
    const waitTime = Math.floor((Date.now() - entry.waitStartedAt.getTime()) / 1000);
    
    // Escalate if wait time exceeds threshold
    if (waitTime > maxWaitTime) {
      return true;
    }

    // Escalate if already marked as exceeded and not yet escalated
    if (entry.slaExceeded && !entry.escalated) {
      return true;
    }

    return false;
  }

  /**
   * Get queue statistics
   */
  getQueueStats(entries: QueueEntry[]) {
    const waiting = entries.filter(e => e.status === 'waiting');
    const assigned = entries.filter(e => e.status === 'assigned' || e.status === 'in_progress');
    const completed = entries.filter(e => e.status === 'completed');

    const waitTimes = waiting.map(e => 
      Math.floor((Date.now() - e.waitStartedAt.getTime()) / 1000)
    );

    const avgWaitTime = waitTimes.length > 0
      ? waitTimes.reduce((a, b) => a + b, 0) / waitTimes.length
      : 0;

    const maxWaitTime = waitTimes.length > 0
      ? Math.max(...waitTimes)
      : 0;

    return {
      waiting: waiting.length,
      assigned: assigned.length,
      completed: completed.length,
      total: entries.length,
      avgWaitTime: Math.round(avgWaitTime),
      maxWaitTime: Math.round(maxWaitTime),
      slaViolations: entries.filter(e => e.slaExceeded).length
    };
  }
}
