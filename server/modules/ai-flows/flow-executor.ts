// ========================================
// AI FLOW EXECUTOR ENGINE
// ========================================
// Executes visual flows by processing node graphs
// Handles conditional logic, loops, error handling, and variable management

import { AiActionFlow, AiFlowExecution } from '../../../shared/schema-ai-flows';
import { db } from '../../db';
import { aiFlowExecutions } from '../../../shared/schema-ai-flows';

// ========================================
// TYPES
// ========================================

interface FlowNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: Record<string, any>;
}

interface FlowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
  label?: string;
}

interface ExecutionContext {
  variables: Record<string, any>;
  conversationId?: string;
  userId?: string;
  tenantId: string;
}

interface NodeExecutionResult {
  nodeId: string;
  nodeType: string;
  status: 'completed' | 'failed' | 'skipped';
  input?: Record<string, any>;
  output?: Record<string, any>;
  error?: string;
  nextNodes?: string[]; // For conditional branching
}

// ========================================
// FLOW EXECUTOR CLASS
// ========================================

export class FlowExecutor {
  private flow: AiActionFlow;
  private context: ExecutionContext;
  private executionId: string;
  private executionLog: Array<{
    nodeId: string;
    nodeType: string;
    startTime: string;
    endTime?: string;
    status: 'running' | 'completed' | 'failed' | 'skipped';
    input?: Record<string, any>;
    output?: Record<string, any>;
    error?: string;
  }> = [];

  constructor(flow: AiActionFlow, context: ExecutionContext) {
    this.flow = flow;
    this.context = context;
    this.executionId = '';
  }

  // ========================================
  // MAIN EXECUTION
  // ========================================

  async execute(input: Record<string, any> = {}): Promise<{
    success: boolean;
    output?: Record<string, any>;
    error?: string;
    executionId: string;
  }> {
    try {
      // Create execution record
      const [execution] = await db.insert(aiFlowExecutions).values({
        flowId: this.flow.id,
        tenantId: this.context.tenantId,
        conversationId: this.context.conversationId,
        triggeredBy: this.context.userId,
        status: 'running',
        input,
        nodeExecutions: []
      }).returning();

      this.executionId = execution.id;

      // Initialize context variables with input
      this.context.variables = { ...input };

      // Find start node
      const startNode = this.flow.nodes.find(n => 
        n.type === 'trigger_start' || 
        n.type.startsWith('trigger_')
      );

      if (!startNode) {
        throw new Error('No start/trigger node found in flow');
      }

      // Execute flow starting from trigger node
      const result = await this.executeNode(startNode);

      // Update execution record with final status
      await db.update(aiFlowExecutions)
        .set({
          status: result.status === 'failed' ? 'failed' : 'completed',
          output: result.output,
          error: result.error,
          completedAt: new Date(),
          duration: Date.now() - new Date(execution.startedAt).getTime(),
          nodeExecutions: this.executionLog
        })
        .where({ id: this.executionId });

      return {
        success: result.status !== 'failed',
        output: result.output,
        error: result.error,
        executionId: this.executionId
      };

    } catch (error: any) {
      console.error('[FlowExecutor] Execution error:', error);
      
      // Update execution record with error
      if (this.executionId) {
        await db.update(aiFlowExecutions)
          .set({
            status: 'failed',
            error: error.message,
            completedAt: new Date(),
            nodeExecutions: this.executionLog
          })
          .where({ id: this.executionId });
      }

      return {
        success: false,
        error: error.message,
        executionId: this.executionId
      };
    }
  }

  // ========================================
  // NODE EXECUTION
  // ========================================

  private async executeNode(node: FlowNode): Promise<NodeExecutionResult> {
    const startTime = new Date().toISOString();
    
    // Log node execution start
    const logEntry = {
      nodeId: node.id,
      nodeType: node.type,
      startTime,
      status: 'running' as const,
      input: { ...this.context.variables }
    };
    this.executionLog.push(logEntry);

    try {
      // Resolve variables in node configuration
      const resolvedData = this.resolveVariables(node.data);

      // Execute node based on type
      const output = await this.executeNodeHandler(node.type, resolvedData);

      // Update log entry
      logEntry.status = 'completed';
      logEntry.endTime = new Date().toISOString();
      logEntry.output = output;

      // Merge output into context variables
      if (output) {
        this.context.variables = { ...this.context.variables, ...output };
      }

      // Find and execute next nodes
      const nextNodes = await this.getNextNodes(node.id, output);

      if (nextNodes.length > 0) {
        // Execute next nodes (handle branching)
        for (const nextNodeId of nextNodes) {
          const nextNode = this.flow.nodes.find(n => n.id === nextNodeId);
          if (nextNode) {
            await this.executeNode(nextNode);
          }
        }
      }

      return {
        nodeId: node.id,
        nodeType: node.type,
        status: 'completed',
        input: resolvedData,
        output
      };

    } catch (error: any) {
      console.error(`[FlowExecutor] Node execution error (${node.type}):`, error);
      
      // Update log entry with error
      logEntry.status = 'failed';
      logEntry.endTime = new Date().toISOString();
      logEntry.error = error.message;

      return {
        nodeId: node.id,
        nodeType: node.type,
        status: 'failed',
        error: error.message
      };
    }
  }

  // ========================================
  // NODE HANDLERS
  // ========================================

  private async executeNodeHandler(
    nodeType: string, 
    data: Record<string, any>
  ): Promise<Record<string, any>> {
    
    // Import node handlers dynamically
    const handlers = await import('./node-handlers');

    // Map node type to handler function
    const handlerMap: Record<string, string> = {
      // Triggers
      'trigger_start': 'handleTriggerStart',
      'trigger_keyword': 'handleKeywordTrigger',
      'trigger_schedule': 'handleScheduleTrigger',
      'trigger_webhook': 'handleWebhookTrigger',
      
      // Conversation
      'ask_question': 'handleAskQuestion',
      'capture_response': 'handleCaptureResponse',
      'extract_info': 'handleExtractInfo',
      'classify_message': 'handleClassifyMessage',
      'generate_response': 'handleGenerateResponse',
      'confirm_user': 'handleConfirmUser',
      'menu_options': 'handleMenuOptions',
      'sentiment_analysis': 'handleSentimentAnalysis',
      
      // Data
      'search_customer': 'handleSearchCustomer',
      'search_ticket': 'handleSearchTicket',
      'query_database': 'handleQueryDatabase',
      'save_database': 'handleSaveDatabase',
      'transform_data': 'handleTransformData',
      'validate_data': 'handleValidateData',
      
      // Logic
      'condition_if': 'handleCondition',
      'loop_foreach': 'handleForEach',
      'wait_delay': 'handleWait',
      'try_catch': 'handleTryCatch',
      'set_variable': 'handleSetVariable',
      
      // Actions
      'create_ticket': 'handleCreateTicket',
      'update_ticket': 'handleUpdateTicket',
      'create_customer': 'handleCreateCustomer',
      'update_customer': 'handleUpdateCustomer',
      'schedule_meeting': 'handleScheduleMeeting',
      'add_comment': 'handleAddComment',
      'change_status': 'handleChangeStatus',
      'assign_user': 'handleAssignUser',
      'add_tag': 'handleAddTag',
      'create_task': 'handleCreateTask',
      
      // Communication
      'send_email': 'handleSendEmail',
      'send_sms': 'handleSendSMS',
      'send_notification': 'handleSendNotification',
      'escalate_human': 'handleEscalateHuman',
      'post_channel': 'handlePostChannel',
      
      // Integrations
      'webhook_call': 'handleWebhookCall',
      'cep_lookup': 'handleCEPLookup',
      'payment_stripe': 'handleStripePayment',
      'custom_script': 'handleCustomScript',
      
      // End
      'end_success': 'handleEndSuccess',
      'end_error': 'handleEndError',
      'chain_action': 'handleChainAction'
    };

    const handlerName = handlerMap[nodeType];
    
    if (!handlerName || !handlers[handlerName]) {
      throw new Error(`No handler found for node type: ${nodeType}`);
    }

    // Execute handler with context
    return await handlers[handlerName](data, this.context);
  }

  // ========================================
  // VARIABLE RESOLUTION
  // ========================================

  private resolveVariables(data: any): any {
    if (typeof data === 'string') {
      // Replace {{variableName}} with actual values
      return data.replace(/\{\{(\w+)\}\}/g, (match, varName) => {
        return this.context.variables[varName] !== undefined 
          ? this.context.variables[varName] 
          : match;
      });
    }

    if (Array.isArray(data)) {
      return data.map(item => this.resolveVariables(item));
    }

    if (typeof data === 'object' && data !== null) {
      const resolved: Record<string, any> = {};
      for (const [key, value] of Object.entries(data)) {
        resolved[key] = this.resolveVariables(value);
      }
      return resolved;
    }

    return data;
  }

  // ========================================
  // FLOW NAVIGATION
  // ========================================

  private async getNextNodes(
    currentNodeId: string, 
    output?: Record<string, any>
  ): Promise<string[]> {
    
    const edges = this.flow.edges.filter(e => e.source === currentNodeId);

    // If no conditional outputs, return all connected nodes
    if (!output || (!output.true && !output.false)) {
      return edges.map(e => e.target);
    }

    // Handle conditional branching (if/else nodes)
    const nextNodes: string[] = [];
    
    for (const edge of edges) {
      // Check if edge has a handle that matches the output
      if (edge.sourceHandle === 'true' && output.true) {
        nextNodes.push(edge.target);
      } else if (edge.sourceHandle === 'false' && output.false) {
        nextNodes.push(edge.target);
      } else if (!edge.sourceHandle) {
        nextNodes.push(edge.target);
      }
    }

    return nextNodes;
  }

  // ========================================
  // UTILITIES
  // ========================================

  getExecutionLog() {
    return this.executionLog;
  }

  getContext() {
    return this.context;
  }
}

// ========================================
// EXPORTS
// ========================================

export async function executeFlow(
  flow: AiActionFlow,
  context: ExecutionContext,
  input?: Record<string, any>
) {
  const executor = new FlowExecutor(flow, context);
  return await executor.execute(input);
}
