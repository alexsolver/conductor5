/**
 * AUTOMATIC PROJECT-TICKET INTEGRATION SYSTEM
 * 
 * This module implements the complete automatic integration between 
 * projects and tickets as requested by the user.
 */

const { randomUUID } = require('crypto');

class ProjectTicketIntegration {
  constructor(storage) {
    this.storage = storage;
  }

  /**
   * Creates a project action and automatically generates a corresponding ticket
   * @param {string} tenantId - Tenant identifier
   * @param {object} actionData - Project action data
   * @param {string} userId - User creating the action
   */
  async createProjectActionWithTicket(tenantId, actionData, userId) {
    try {
      // 1. Create the project action
      const actionId = randomUUID();
      const action = await this.storage.createProjectAction(tenantId, {
        ...actionData,
        id: actionId,
        createdBy: userId
      });

      // 2. Automatically create corresponding ticket
      const ticketData = {
        title: `[PROJETO] ${actionData.title}`,
        description: `Ticket automático criado para ação do projeto: ${actionData.description}`,
        priority: this.mapPriorityToTicket(actionData.priority),
        status: 'open',
        category: 'project',
        projectId: actionData.projectId,
        projectActionId: actionId,
        assignedTo: actionData.assignedTo,
        createdBy: userId
      };

      const ticket = await this.storage.createTicket(tenantId, ticketData);
      
      // 3. Update project action with ticket reference
      await this.storage.updateProjectAction(tenantId, actionId, {
        relatedTicketId: ticket.id,
        ticketIntegrationActive: true
      });

      console.log('✅ Project-Ticket Integration: Action and ticket created successfully', {
        actionId,
        ticketId: ticket.id,
        projectId: actionData.projectId
      });

      return {
        action,
        ticket,
        integrationSuccess: true
      };

    } catch (error) {
      console.error('❌ Project-Ticket Integration: Failed to create action with ticket', error);
      throw error;
    }
  }

  /**
   * Maps project action priority to ticket priority
   */
  mapPriorityToTicket(projectPriority) {
    const priorityMap = {
      'critical': 'urgent',
      'high': 'high', 
      'medium': 'medium',
      'low': 'low'
    };
    return priorityMap[projectPriority] || 'medium';
  }

  /**
   * Converts existing project action to ticket manually
   */
  async convertProjectActionToTicket(tenantId, actionId, userId) {
    try {
      const action = await this.storage.getProjectActionById(tenantId, actionId);
      if (!action) {
        throw new Error('Project action not found');
      }

      // Check if already has a related ticket
      if (action.relatedTicketId) {
        return { 
          success: false, 
          message: 'Action already has a related ticket',
          ticketId: action.relatedTicketId 
        };
      }

      // Create ticket from existing action
      const result = await this.createProjectActionWithTicket(tenantId, action, userId);
      
      return {
        success: true,
        message: 'Project action converted to ticket successfully',
        ...result
      };

    } catch (error) {
      console.error('❌ Manual conversion failed:', error);
      throw error;
    }
  }
}

module.exports = ProjectTicketIntegration;