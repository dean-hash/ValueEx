import express from 'express';
import { ProductManager } from '../../services/mvp/productManager';
import { DemandTracker } from '../../services/mvp/demandTracker';
import { MARKET_VERTICALS } from '../../types/marketTypes';
import { logger } from '../../utils/logger';

const router = express.Router();
const productManager = ProductManager.getInstance();
const demandTracker = DemandTracker.getInstance();

// Admin dashboard
router.get('/', (req, res) => {
  res.render('admin/dashboard', {
    products: productManager.getAllProducts(),
    activeSignals: demandTracker.getActiveSignals(),
    verticals: MARKET_VERTICALS,
  });
});

// Product management
router.post('/products', async (req, res) => {
  try {
    const product = await productManager.addProduct({
      name: req.body.name,
      description: req.body.description,
      price: Number(req.body.price),
      category: req.body.category,
      vertical: MARKET_VERTICALS[req.body.verticalId],
      tags: req.body.tags.split(',').map((tag: string) => tag.trim()),
    });
    res.json(product);
  } catch (error) {
    logger.error('Error adding product:', error);
    res.status(500).json({ error: 'Failed to add product' });
  }
});

router.put('/products/:id/status', (req, res) => {
  const success = productManager.updateProductStatus(req.params.id, req.body.status);
  if (success) {
    res.json({ success: true });
  } else {
    res.status(404).json({ error: 'Product not found' });
  }
});

// Demand tracking
router.post('/demands', async (req, res) => {
  try {
    const signal = await demandTracker.trackDemand(req.body.query);
    res.json(signal);
  } catch (error) {
    logger.error('Error tracking demand:', error);
    res.status(500).json({ error: 'Failed to track demand' });
  }
});

router.post('/demands/:id/fulfill', (req, res) => {
  const success = demandTracker.fulfillDemand(req.params.id, req.body.productId);
  if (success) {
    res.json({ success: true });
  } else {
    res.status(404).json({ error: 'Demand signal not found or already fulfilled' });
  }
});

// Analytics endpoints
router.get('/analytics/demands/fulfilled', (req, res) => {
  const fulfilled = demandTracker.getFulfilledSignals();
  res.json(fulfilled);
});

router.get('/analytics/demands/active', (req, res) => {
  const active = demandTracker.getActiveSignals(req.query.verticalId as string);
  res.json(active);
});

export default router;
