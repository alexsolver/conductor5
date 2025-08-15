
import { Router } from 'express';
import { OmniBridgeController } from './application/controllers/OmniBridgeController';
import { GetChannelsUseCase } from './application/use-cases/GetChannelsUseCase';
import { ToggleChannelUseCase } from './application/use-cases/ToggleChannelUseCase';
import { GetMessagesUseCase } from './application/use-cases/GetMessagesUseCase';
import { ProcessMessageUseCase } from './application/use-cases/ProcessMessageUseCase';
import { DrizzleChannelRepository } from './infrastructure/repositories/DrizzleChannelRepository';
import { DrizzleMessageRepository } from './infrastructure/repositories/DrizzleMessageRepository';

const router = Router();

// Repositories
const channelRepository = new DrizzleChannelRepository();
const messageRepository = new DrizzleMessageRepository();

// Use Cases
const getChannelsUseCase = new GetChannelsUseCase(channelRepository);
const toggleChannelUseCase = new ToggleChannelUseCase(channelRepository);
const getMessagesUseCase = new GetMessagesUseCase(messageRepository);
const processMessageUseCase = new ProcessMessageUseCase(messageRepository);

// Controller
const omniBridgeController = new OmniBridgeController(
  getChannelsUseCase,
  toggleChannelUseCase,
  getMessagesUseCase,
  processMessageUseCase
);

// Routes with authentication
router.get('/channels', async (req, res) => {
  // Add tenant context from JWT
  const { jwtAuth } = await import('../../middleware/jwtAuth');
  return jwtAuth(req, res, () => omniBridgeController.getChannels(req, res));
});

router.post('/channels/:channelId/toggle', async (req, res) => {
  const { jwtAuth } = await import('../../middleware/jwtAuth');
  return jwtAuth(req, res, () => omniBridgeController.toggleChannel(req, res));
});

router.get('/messages', (req, res) => omniBridgeController.getMessages(req, res));
router.post('/messages/:messageId/process', (req, res) => omniBridgeController.processMessage(req, res));

router.get('/inbox/stats', (req, res) => omniBridgeController.getInboxStats(req, res));

// Automation Rules (para implementação futura)
router.get('/automation-rules', (req, res) => {
  res.json({ success: true, rules: [], message: 'Automation rules not implemented yet' });
});

router.post('/automation-rules', (req, res) => {
  res.status(501).json({ error: 'Automation rules creation not implemented yet' });
});

// Templates (para implementação futura)
router.get('/templates', (req, res) => {
  res.json({ success: true, templates: [], message: 'Templates not implemented yet' });
});

router.post('/templates', (req, res) => {
  res.status(501).json({ error: 'Template creation not implemented yet' });
});

// Chatbots (para implementação futura)
router.get('/chatbots', (req, res) => {
  res.json({ success: true, chatbots: [], message: 'Chatbots not implemented yet' });
});

router.post('/chatbots', (req, res) => {
  res.status(501).json({ error: 'Chatbot creation not implemented yet' });
});

export { router as omniBridgeRoutes };
