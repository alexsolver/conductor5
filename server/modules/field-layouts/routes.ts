import { Router } from 'express';
import { jwtAuth } from '../../middleware/jwtAuth';
import { enhancedTenantValidator } from '../../middleware/tenantValidator';
import { FieldLayoutController } from './application/controllers/FieldLayoutController';
import { DrizzleFieldLayoutRepository } from './infrastructure/repositories/DrizzleFieldLayoutRepository';
import { db } from '../../db';

const router = Router();

// Middleware de autenticação para todas as rotas
router.use(jwtAuth);
router.use(enhancedTenantValidator());

// Inicializar dependências
const fieldLayoutRepository = new DrizzleFieldLayoutRepository(db);
const fieldLayoutController = new FieldLayoutController();

// Get layout for a specific module/page
router.get('/:moduleType/:pageType', async (req, res) => {
  try {
    const { moduleType, pageType } = req.params;
    const { customerId } = req.query;

    const layout = await fieldLayoutController.getLayout(
      moduleType,
      pageType,
      customerId as string
    );

    if (!layout) {
      return res.status(404).json({
        success: false,
        message: 'Layout not found'
      });
    }

    res.json({
      success: true,
      layout
    });
  } catch (error) {
    console.error('Error fetching layout:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get layout for a specific customer
router.get('/:moduleType/:pageType/customer/:customerId', async (req, res) => {
  try {
    const { moduleType, pageType, customerId } = req.params;

    const layout = await fieldLayoutController.getLayout(moduleType, pageType, customerId);

    if (!layout) {
      return res.status(404).json({
        success: false,
        message: 'Layout not found'
      });
    }

    res.json({
      success: true,
      layout
    });
  } catch (error) {
    console.error('Error fetching customer layout:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Save/update layout
router.post('/:moduleType/:pageType', async (req, res) => {
  try {
    const { moduleType, pageType } = req.params;
    const layoutData = {
      ...req.body,
      moduleType,
      pageType
    };

    const savedLayout = await fieldLayoutController.saveLayout(layoutData);

    res.json({
      success: true,
      layout: savedLayout,
      message: 'Layout saved successfully'
    });
  } catch (error) {
    console.error('Error saving layout:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Save/update customer-specific layout
router.post('/:moduleType/:pageType/customer/:customerId', async (req, res) => {
  try {
    const { moduleType, pageType, customerId } = req.params;
    const layoutData = {
      ...req.body,
      moduleType,
      pageType,
      customerId
    };

    const savedLayout = await fieldLayoutController.saveLayout(layoutData);

    res.json({
      success: true,
      layout: savedLayout,
      message: 'Customer layout saved successfully'
    });
  } catch (error) {
    console.error('Error saving customer layout:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Add a field to a layout
router.post('/:moduleType/:pageType/sections/:sectionId/fields', async (req, res) => {
  try {
    const { moduleType, pageType, sectionId } = req.params;
    const { customerId } = req.query;
    const fieldData = req.body;

    const updatedLayout = await fieldLayoutController.addFieldToLayout(
      moduleType,
      pageType,
      sectionId,
      fieldData,
      customerId as string
    );

    if (!updatedLayout) {
      return res.status(404).json({
        success: false,
        message: 'Layout or section not found'
      });
    }

    res.json({
      success: true,
      layout: updatedLayout,
      message: 'Field added successfully'
    });
  } catch (error) {
    console.error('Error adding field:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Remove a field from layout
router.delete('/:moduleType/:pageType/fields/:fieldId', async (req, res) => {
  try {
    const { moduleType, pageType, fieldId } = req.params;
    const { customerId } = req.query;

    const updatedLayout = await fieldLayoutController.removeFieldFromLayout(
      moduleType,
      pageType,
      fieldId,
      customerId as string
    );

    if (!updatedLayout) {
      return res.status(404).json({
        success: false,
        message: 'Layout or field not found'
      });
    }

    res.json({
      success: true,
      layout: updatedLayout,
      message: 'Field removed successfully'
    });
  } catch (error) {
    console.error('Error removing field:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Demo endpoint to add sample fields
router.post('/:moduleType/:pageType/demo', async (req, res) => {
  try {
    const { moduleType, pageType } = req.params;

    const updatedLayout = await fieldLayoutController.addDemoFields(moduleType, pageType);

    if (!updatedLayout) {
      return res.status(404).json({
        success: false,
        message: 'Layout not found'
      });
    }

    res.json({
      success: true,
      layout: updatedLayout,
      message: 'Demo fields added successfully'
    });
  } catch (error) {
    console.error('Error adding demo fields:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

export { router as fieldLayoutRoutes };