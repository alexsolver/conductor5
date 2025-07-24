import { Router } from 'express';
import { Module1PartsController } from './application/controllers/Module1PartsController';

const router = Router();
const controller = new Module1PartsController();

// MÓDULO 1 - GESTÃO DE PEÇAS COMPLETA
// Rotas com prefixo /api/parts-services/module1

// GET /module1/parts - Listar peças com filtros
router.get('/parts', (req, res) => controller.getParts(req, res));

// GET /module1/parts/:id - Buscar peça específica
router.get('/parts/:id', (req, res) => controller.getPartById(req, res));

// POST /module1/parts - Criar nova peça
router.post('/parts', (req, res) => controller.createPart(req, res));

// PUT /module1/parts/:id - Atualizar peça
router.put('/parts/:id', (req, res) => controller.updatePart(req, res));

// DELETE /module1/parts/:id - Remover peça (soft delete)
router.delete('/parts/:id', (req, res) => controller.deletePart(req, res));

// GET /module1/stats - Estatísticas do módulo
router.get('/stats', (req, res) => controller.getStats(req, res));

export default router;