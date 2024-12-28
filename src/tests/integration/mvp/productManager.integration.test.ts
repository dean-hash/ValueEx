import { ProductManager } from '../../../services/mvp/productManager';
import { MARKET_VERTICALS } from '../../../types/marketTypes';

describe('MVP Product Manager Integration Tests', () => {
  const productManager = ProductManager.getInstance();

  beforeEach(() => {
    productManager.clearProducts();
  });

  it('should add and analyze a product', async () => {
    const product = await productManager.addProduct({
      name: 'Wireless Gaming Headphones',
      description: 'High-quality gaming headphones with low latency',
      price: 149.99,
      category: 'Gaming Accessories',
      vertical: MARKET_VERTICALS.electronics,
      tags: ['gaming', 'wireless', 'audio'],
      source: 'manual',
      status: 'active'
    });

    expect(product).toHaveProperty('id');
    expect(product.resonanceFactors).toBeDefined();
    expect(product.resonanceFactors?.demandMatch).toBeGreaterThan(0);
  });

  it('should find matching products based on criteria', async () => {
    // Add test products
    await productManager.addProduct({
      name: 'Budget Gaming Headset',
      description: 'Affordable gaming headset for casual gamers',
      price: 49.99,
      category: 'Gaming Accessories',
      vertical: MARKET_VERTICALS.electronics,
      tags: ['gaming', 'budget', 'audio'],
      source: 'manual',
      status: 'active'
    });

    await productManager.addProduct({
      name: 'Premium Gaming Headset',
      description: 'Professional gaming headset with surround sound',
      price: 199.99,
      category: 'Gaming Accessories',
      vertical: MARKET_VERTICALS.electronics,
      tags: ['gaming', 'premium', 'audio'],
      source: 'manual',
      status: 'active'
    });

    // Test price range filtering
    const budgetMatches = productManager.findMatches({
      priceRange: { min: 0, max: 100 },
    });
    expect(budgetMatches).toHaveLength(1);
    expect(budgetMatches[0].price).toBeLessThan(100);

    // Test tag filtering
    const premiumMatches = productManager.findMatches({
      tags: ['premium'],
    });
    expect(premiumMatches).toHaveLength(1);
    expect(premiumMatches[0].name).toContain('Premium');
  });

  it('should update product status', async () => {
    const product = await productManager.addProduct({
      name: 'Test Product',
      description: 'Test Description',
      price: 99.99,
      category: 'Test Category',
      vertical: MARKET_VERTICALS.electronics,
      tags: ['test'],
      source: 'manual',
      status: 'active'
    });

    const updated = productManager.updateProductStatus(product.id, 'inactive');
    expect(updated).toBe(true);

    const allProducts = productManager.getAllProducts();
    const updatedProduct = allProducts.find((p) => p.id === product.id);
    expect(updatedProduct?.status).toBe('inactive');
  });
});
