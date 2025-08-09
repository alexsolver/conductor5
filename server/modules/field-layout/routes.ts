
import { Router } from 'express';
import { jwtAuth } from '../../middleware/jwtAuth';

const fieldLayoutRouter = Router();

// Field layout endpoints
fieldLayoutRouter.get('/', jwtAuth, async (req, res) => {
  // Controller logic here
  res.json({ message: 'Field layouts endpoint' });
});

fieldLayoutRouter.post('/', jwtAuth, async (req, res) => {
  // Controller logic here
  res.json({ message: 'Create field layout endpoint' });
});

export { fieldLayoutRouter };
