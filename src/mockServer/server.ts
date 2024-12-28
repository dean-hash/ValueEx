import express from 'express';
import cors from 'cors';
import { mockProducts, mockDemandPatterns } from './mockData';

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

// Products endpoints
app.get('/api/products', (req, res) => {
  const { searchTerm, categoryId, minPrice, maxPrice } = req.query;

  let filteredProducts = [...mockProducts];

  if (searchTerm) {
    filteredProducts = filteredProducts.filter(
      (p) =>
        p.title.toLowerCase().includes(String(searchTerm).toLowerCase()) ||
        p.description.toLowerCase().includes(String(searchTerm).toLowerCase())
    );
  }

  if (categoryId) {
    filteredProducts = filteredProducts.filter((p) =>
      p.categories.some((c) => c.toLowerCase() === String(categoryId).toLowerCase())
    );
  }

  if (minPrice) {
    filteredProducts = filteredProducts.filter((p) => p.price >= Number(minPrice));
  }

  if (maxPrice) {
    filteredProducts = filteredProducts.filter((p) => p.price <= Number(maxPrice));
  }

  res.json(filteredProducts);
});

app.get('/api/products/:id', (req, res) => {
  const product = mockProducts.find((p) => p.id === req.params.id);
  if (product) {
    res.json(product);
  } else {
    res.status(404).json({ error: 'Product not found' });
  }
});

// Demand pattern endpoints
app.get('/api/demand-patterns', (req, res) => {
  res.json(mockDemandPatterns);
});

app.get('/api/demand-patterns/:id', (req, res) => {
  const pattern = mockDemandPatterns.find((p) => p.id === req.params.id);
  if (pattern) {
    res.json(pattern);
  } else {
    res.status(404).json({ error: 'Demand pattern not found' });
  }
});

// Resonance endpoint
app.post('/api/calculate-resonance', (req, res) => {
  const { productId, patternId } = req.body;

  const product = mockProducts.find((p) => p.id === productId);
  const pattern = mockDemandPatterns.find((p) => p.id === patternId);

  if (!product || !pattern) {
    res.status(404).json({ error: 'Product or pattern not found' });
    return;
  }

  // Mock resonance calculation
  const resonance = {
    score: Math.random() * 0.5 + 0.5, // Random score between 0.5 and 1
    confidence: product.confidence,
    coherence: product.coherence,
    factors: {
      categoryMatch: Math.random(),
      priceAlignment: Math.random(),
      demandIntensity: pattern.intensity,
    },
  };

  res.json(resonance);
});

app.listen(port, () => {
  console.log(`Mock server running at http://localhost:${port}`);
});
