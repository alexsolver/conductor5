import { InterviewState } from './ConversationalInterviewEngine';

/**
 * Singleton manager for interview states
 * Stores interview states in memory (in production, consider using Redis)
 */
export class InterviewStateManager {
  private static instance: InterviewStateManager;
  private states: Map<string, InterviewState>;

  private constructor() {
    this.states = new Map();
  }

  static getInstance(): InterviewStateManager {
    if (!InterviewStateManager.instance) {
      InterviewStateManager.instance = new InterviewStateManager();
    }
    return InterviewStateManager.instance;
  }

  async getState(conversationId: string): Promise<InterviewState | null> {
    return this.states.get(conversationId) || null;
  }

  async setState(conversationId: string, state: InterviewState): Promise<void> {
    this.states.set(conversationId, state);
  }

  async clearState(conversationId: string): Promise<void> {
    this.states.delete(conversationId);
  }

  async hasState(conversationId: string): Promise<boolean> {
    return this.states.has(conversationId);
  }
}
