import { Router } from 'express';
import { AiAgentController } from '../application/controllers/AiAgentController';
import { DrizzleAiAgentRepository } from '../infrastructure/repositories/DrizzleAiAgentRepository';

export function createAiAgentRoutes(): Router {
  const router = Router();
  const repository = new DrizzleAiAgentRepository();
  const controller = new AiAgentController(repository);

  router.post('/agents', (req, res) => controller.createAgent(req, res));
  router.get('/agents', (req, res) => controller.getAgents(req, res));
  router.get('/agents/:id', (req, res) => controller.getAgent(req, res));
  router.put('/agents/:id', (req, res) => controller.updateAgent(req, res));
  router.delete('/agents/:id', (req, res) => controller.deleteAgent(req, res));
  
  router.get('/forms/available', (req, res) => controller.getAvailableForms(req, res));

  console.log('🤖 [AiAgentRoutes] AI Agent routes configured (simplified)');

  return router;
}
