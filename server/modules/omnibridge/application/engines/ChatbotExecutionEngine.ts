import { IChatbotNodeRepository } from '../../domain/repositories/IChatbotNodeRepository';
import { IChatbotEdgeRepository } from '../../domain/repositories/IChatbotEdgeRepository';
import { IChatbotExecutionRepository } from '../../domain/repositories/IChatbotExecutionRepository';
import { 
  SelectChatbotNode, 
  SelectChatbotEdge, 
  SelectChatbotExecution 
} from '../../../../../shared/schema-chatbot';
import { ChatbotNodeProcessor } from './ChatbotNodeProcessor.js';

export interface ExecutionContext {
  execution: SelectChatbotExecution;
  userInput: string;
  context: any;
  variables?: Record<string, any>;
}

export interface ExecutionResult {
  success: boolean;
  responses: Array<{
    type: 'text' | 'media' | 'form' | 'action';
    content: any;
    nodeId: string;
    timestamp: Date;
  }>;
  fallbackToHuman?: boolean;
  error?: string;
  finalContext?: any;
}

export class ChatbotExecutionEngine {
  private nodeProcessor: ChatbotNodeProcessor;
  private maxExecutionDepth = 100; // Prevent infinite loops
  private executionTimeout = 30000; // 30 seconds timeout

  constructor(
    private nodeRepository: IChatbotNodeRepository,
    private edgeRepository: IChatbotEdgeRepository,
    private executionRepository: IChatbotExecutionRepository
  ) {
    this.nodeProcessor = new ChatbotNodeProcessor();
  }

  async executeFlow(context: ExecutionContext): Promise<ExecutionResult> {
    const { execution, userInput, context: executionContext } = context;
    const responses: ExecutionResult['responses'] = [];
    let currentContext = { ...executionContext };
    let executionDepth = 0;
    let fallbackToHuman = false;

    // Create timeout promise
    const timeoutPromise = new Promise<ExecutionResult>((_, reject) => {
      setTimeout(() => {
        reject(new Error('Execution timeout'));
      }, this.executionTimeout);
    });

    try {
      // Find start node(s) for the flow
      const startNodes = await this.nodeRepository.findStartNodes(execution.flowId);
      
      if (startNodes.length === 0) {
        return {
          success: false,
          responses: [],
          error: 'No start node found in flow'
        };
      }

      // Use the first start node (flows should have only one start node)
      const startNode = startNodes[0];
      
      // Begin execution from start node with timeout
      const executionPromise = this.executeFromNode(
        startNode,
        currentContext,
        userInput,
        execution.id,
        executionDepth
      );

      // Race between execution and timeout
      const result = await Promise.race([
        executionPromise.then(result => ({
          success: result.success,
          responses: result.responses,
          fallbackToHuman: result.fallbackToHuman,
          error: result.error,
          finalContext: result.context
        })),
        timeoutPromise
      ]);

      return result;

    } catch (error) {
      console.error('Flow execution error:', error);
      
      // Check if it's a timeout error
      if (error instanceof Error && error.message === 'Execution timeout') {
        return {
          success: false,
          responses: [],
          error: 'Flow execution timed out',
          fallbackToHuman: true,
          finalContext: currentContext
        };
      }

      return {
        success: false,
        responses: [],
        error: error instanceof Error ? error.message : 'Flow execution failed',
        fallbackToHuman: true,
        finalContext: currentContext
      };
    }
  }

  private async executeFromNode(
    node: SelectChatbotNode,
    context: any,
    userInput: string,
    executionId: string,
    depth: number
  ): Promise<{
    success: boolean;
    responses: ExecutionResult['responses'];
    fallbackToHuman?: boolean;
    error?: string;
    context: any;
  }> {
    // Prevent infinite recursion
    if (depth > this.maxExecutionDepth) {
      return {
        success: false,
        responses: [],
        error: 'Maximum execution depth exceeded',
        fallbackToHuman: true,
        context
      };
    }

    // Skip disabled nodes
    if (!node.isEnabled) {
      return await this.continueExecution(node, context, userInput, executionId, depth);
    }

    try {
      // Add node to execution trace
      await this.executionRepository.addToNodeTrace(
        executionId,
        node.id,
        new Date(),
        { userInput, depth }
      );

      // Process the current node
      const nodeResult = await this.nodeProcessor.processNode(node, context, userInput);
      
      // Update execution context
      context = { ...context, ...nodeResult.context };
      
      const responses: ExecutionResult['responses'] = [];

      // Handle node responses
      if (nodeResult.responses && nodeResult.responses.length > 0) {
        for (const response of nodeResult.responses) {
          responses.push({
            type: response.type,
            content: response.content,
            nodeId: node.id,
            timestamp: new Date()
          });
        }
      }

      // Check if this is an end node or if we should stop execution
      if (node.isEnd || nodeResult.shouldStop) {
        return {
          success: true,
          responses,
          fallbackToHuman: nodeResult.fallbackToHuman,
          context
        };
      }

      // Check for specific termination conditions based on node result
      if (nodeResult.fallbackToHuman) {
        return {
          success: true,
          responses,
          fallbackToHuman: true,
          context
        };
      }

      if (nodeResult.error) {
        return {
          success: false,
          responses,
          error: nodeResult.error,
          fallbackToHuman: true,
          context
        };
      }

      // Continue execution to next nodes
      const continuationResult = await this.continueExecution(node, context, userInput, executionId, depth);
      
      return {
        success: continuationResult.success,
        responses: [...responses, ...continuationResult.responses],
        fallbackToHuman: continuationResult.fallbackToHuman,
        error: continuationResult.error,
        context: continuationResult.context
      };

    } catch (error) {
      console.error(`Error processing node ${node.id}:`, error);
      return {
        success: false,
        responses: [],
        error: `Node processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        fallbackToHuman: true,
        context
      };
    }
  }

  private async continueExecution(
    fromNode: SelectChatbotNode,
    context: any,
    userInput: string,
    executionId: string,
    depth: number
  ): Promise<{
    success: boolean;
    responses: ExecutionResult['responses'];
    fallbackToHuman?: boolean;
    error?: string;
    context: any;
  }> {
    // Get outgoing edges from current node
    const outgoingEdges = await this.edgeRepository.findFromNode(fromNode.id);
    
    if (outgoingEdges.length === 0) {
      // No outgoing edges - this is a dead end
      return {
        success: true,
        responses: [],
        context
      };
    }

    // Filter enabled edges
    const enabledEdges = outgoingEdges.filter(edge => edge.isEnabled);
    
    if (enabledEdges.length === 0) {
      return {
        success: true,
        responses: [],
        context
      };
    }

    // Determine which edge to follow
    const nextEdge = await this.selectNextEdge(enabledEdges, context, userInput);
    
    if (!nextEdge) {
      // No suitable edge found
      return {
        success: true,
        responses: [],
        fallbackToHuman: true,
        context
      };
    }

    // Get the target node
    const nextNode = await this.nodeRepository.findById(nextEdge.toNodeId);
    
    if (!nextNode) {
      return {
        success: false,
        responses: [],
        error: `Target node ${nextEdge.toNodeId} not found`,
        context
      };
    }

    // Continue execution from the next node
    return await this.executeFromNode(
      nextNode,
      context,
      userInput,
      executionId,
      depth + 1
    );
  }

  private async selectNextEdge(
    edges: SelectChatbotEdge[],
    context: any,
    userInput: string
  ): Promise<SelectChatbotEdge | null> {
    // Sort edges by priority (order field)
    edges.sort((a, b) => (a.order || 0) - (b.order || 0));

    for (const edge of edges) {
      // If edge has no condition, it's always valid
      if (!edge.condition) {
        return edge;
      }

      // Evaluate edge condition
      try {
        const conditionResult = await this.evaluateCondition(edge.condition, context, userInput);
        if (conditionResult) {
          return edge;
        }
      } catch (error) {
        console.warn(`Failed to evaluate condition for edge ${edge.id}:`, error);
        continue;
      }
    }

    // If no conditional edges matched, look for a default edge
    const defaultEdge = edges.find(edge => edge.kind === 'default');
    return defaultEdge || null;
  }

  private async evaluateCondition(
    condition: string,
    context: any,
    userInput: string
  ): Promise<boolean> {
    try {
      // Enhanced condition evaluation with context variable support
      
      // Handle context-based conditions
      if (condition.includes('context.')) {
        // Extract context variable conditions like "context.sentiment == 'positive'"
        const contextMatch = condition.match(/context\.(\w+)\s*(==|!=|contains|startsWith|matches)\s*['"](.*?)['"]|\s*(\w+)/);
        if (contextMatch) {
          const [, variable, operator, value] = contextMatch;
          const contextValue = String(context[variable] || '');
          
          switch (operator) {
            case '==':
              return contextValue.toLowerCase() === value.toLowerCase();
            case '!=':
              return contextValue.toLowerCase() !== value.toLowerCase();
            case 'contains':
              return contextValue.toLowerCase().includes(value.toLowerCase());
            case 'startsWith':
              return contextValue.toLowerCase().startsWith(value.toLowerCase());
            case 'matches':
              const regex = new RegExp(value, 'i');
              return regex.test(contextValue);
          }
        }
      }

      // Handle userInput-based conditions (original logic)
      if (condition.includes('userInput.')) {
        if (condition.includes('contains')) {
          const match = condition.match(/contains\s*\(\s*['"](.*?)['"]\s*\)/);
          if (match) {
            return userInput.toLowerCase().includes(match[1].toLowerCase());
          }
        }

        if (condition.includes('equals')) {
          const match = condition.match(/equals\s*\(\s*['"](.*?)['"]\s*\)/);
          if (match) {
            return userInput.toLowerCase() === match[1].toLowerCase();
          }
        }

        if (condition.includes('startsWith')) {
          const match = condition.match(/startsWith\s*\(\s*['"](.*?)['"]\s*\)/);
          if (match) {
            return userInput.toLowerCase().startsWith(match[1].toLowerCase());
          }
        }

        if (condition.includes('matches')) {
          const match = condition.match(/matches\s*\(\s*['"](.*?)['"]\s*\)/);
          if (match) {
            const regex = new RegExp(match[1], 'i');
            return regex.test(userInput);
          }
        }
      }

      // Simple function-style conditions (backward compatibility)
      if (condition.includes('contains(')) {
        const match = condition.match(/contains\s*\(\s*['"](.*?)['"]\s*\)/);
        if (match) {
          return userInput.toLowerCase().includes(match[1].toLowerCase());
        }
      }

      if (condition.includes('equals(')) {
        const match = condition.match(/equals\s*\(\s*['"](.*?)['"]\s*\)/);
        if (match) {
          return userInput.toLowerCase() === match[1].toLowerCase();
        }
      }

      if (condition.includes('startsWith(')) {
        const match = condition.match(/startsWith\s*\(\s*['"](.*?)['"]\s*\)/);
        if (match) {
          return userInput.toLowerCase().startsWith(match[1].toLowerCase());
        }
      }

      if (condition.includes('matches(')) {
        const match = condition.match(/matches\s*\(\s*['"](.*?)['"]\s*\)/);
        if (match) {
          const regex = new RegExp(match[1], 'i');
          return regex.test(userInput);
        }
      }

      // Simple boolean evaluation for conditions like "true", "false", or variable names
      if (condition === 'true') return true;
      if (condition === 'false') return false;
      
      // Check if it's a context variable that should be truthy
      if (context[condition] !== undefined) {
        return Boolean(context[condition]);
      }

      // Default: assume condition is met
      console.warn(`Unknown condition format: ${condition}`);
      return true;

    } catch (error) {
      console.warn('Condition evaluation error:', error);
      return false;
    }
  }

  async validateFlow(flowId: string): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
  }> {
    // Delegate to node repository for structural validation
    const nodeValidation = await this.nodeRepository.validateFlowStructure(flowId);
    
    // Check for edge cycle detection
    const edgeValidation = await this.edgeRepository.detectCycles(flowId);
    
    const errors = [...nodeValidation.errors];
    const warnings = [...nodeValidation.warnings];
    
    if (edgeValidation.hasCycles) {
      errors.push(`Flow contains cycles that could cause infinite loops`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }
}