import { Router } from 'express';
import { completePartsServicesController } from '../application/controllers/CompletePartsServicesController';
import { jwtAuth } from '../../../middleware/jwtAuth';

const router = Router();

// Aplicar autenticação JWT a todas as rotas
router.use(jwtAuth);

// ==============================================
// ITEMS - ROTAS COMPLETAS
// ==============================================

// CRUD básico de itens
router.get('/items', completePartsServicesController.getAllItems);
router.post('/items', completePartsServicesController.createItem);
router.put('/items/:id', completePartsServicesController.updateItem);
router.delete('/items/:id', completePartsServicesController.deleteItem);

// Anexos de itens
router.post('/items/:itemId/attachments', completePartsServicesController.addItemAttachment);
router.get('/items/:itemId/attachments', completePartsServicesController.getItemAttachments);
router.delete('/attachments/:attachmentId', completePartsServicesController.deleteItemAttachment);

// Vínculos entre itens
router.post('/items/:itemId/links', completePartsServicesController.createItemLink);
router.get('/items/:itemId/links', completePartsServicesController.getItemLinks);
router.delete('/item-links/:linkId', completePartsServicesController.deleteItemLink);

// Vínculos com clientes
router.post('/items/:itemId/customer-links', completePartsServicesController.createItemCustomerLink);
router.get('/items/:itemId/customer-links', completePartsServicesController.getItemCustomerLinks);
router.put('/customer-links/:linkId', completePartsServicesController.updateItemCustomerLink);
router.delete('/customer-links/:linkId', completePartsServicesController.deleteItemCustomerLink);

// Vínculos com fornecedores
router.post('/items/:itemId/supplier-links', completePartsServicesController.createItemSupplierLink);
router.get('/items/:itemId/supplier-links', completePartsServicesController.getItemSupplierLinks);

// ==============================================
// CONTROLE DE ESTOQUE AVANÇADO
// ==============================================

// Localizações de estoque
router.get('/stock-locations', completePartsServicesController.getAllStockLocations);
router.post('/stock-locations', completePartsServicesController.createStockLocation);

// Níveis de estoque
router.get('/stock-levels', completePartsServicesController.getStockLevels);

// Movimentações de estoque
router.post('/stock-movements', completePartsServicesController.createStockMovement);
router.get('/stock-movements', completePartsServicesController.getStockMovements);

// Reservas de estoque
router.post('/stock-reservations', completePartsServicesController.createStockReservation);
router.get('/stock-reservations', completePartsServicesController.getActiveReservations);

// ==============================================
// KITS DE SERVIÇO
// ==============================================

router.get('/service-kits', completePartsServicesController.getAllServiceKits);
router.post('/service-kits', completePartsServicesController.createServiceKit);
router.get('/service-kits/:kitId', completePartsServicesController.getServiceKitWithItems);
router.post('/service-kits/:kitId/items', completePartsServicesController.addItemToServiceKit);

// ==============================================
// LISTAS DE PREÇOS
// ==============================================

router.get('/price-lists-complete', completePartsServicesController.getAllPriceLists);
router.post('/price-lists-complete', completePartsServicesController.createPriceList);
router.get('/price-lists-complete/:priceListId', completePartsServicesController.getPriceListWithItems);

// ==============================================
// CONTROLE DE ATIVOS
// ==============================================

router.get('/assets-complete', completePartsServicesController.getAllAssets);
router.post('/assets-complete', completePartsServicesController.createAsset);
router.get('/assets-complete/:assetId/hierarchy', completePartsServicesController.getAssetHierarchy);
router.post('/assets-complete/:assetId/movements', completePartsServicesController.recordAssetMovement);

// ==============================================
// DASHBOARD E ESTATÍSTICAS
// ==============================================

router.get('/dashboard/stats-complete', completePartsServicesController.getDashboardStats);

export default router;