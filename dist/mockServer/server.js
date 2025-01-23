"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const mockData_1 = require("./mockData");
const app = (0, express_1.default)();
const port = 3000;
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Products endpoints
app.get('/api/products', (req, res) => {
    const { searchTerm, categoryId, minPrice, maxPrice } = req.query;
    let filteredProducts = [...mockData_1.mockProducts];
    if (searchTerm) {
        filteredProducts = filteredProducts.filter((p) => p.title.toLowerCase().includes(String(searchTerm).toLowerCase()) ||
            p.description.toLowerCase().includes(String(searchTerm).toLowerCase()));
    }
    if (categoryId) {
        filteredProducts = filteredProducts.filter((p) => p.categories.some((c) => c.toLowerCase() === String(categoryId).toLowerCase()));
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
    const product = mockData_1.mockProducts.find((p) => p.id === req.params.id);
    if (product) {
        res.json(product);
    }
    else {
        res.status(404).json({ error: 'Product not found' });
    }
});
// Demand pattern endpoints
app.get('/api/demand-patterns', (req, res) => {
    res.json(mockData_1.mockDemandPatterns);
});
app.get('/api/demand-patterns/:id', (req, res) => {
    const pattern = mockData_1.mockDemandPatterns.find((p) => p.id === req.params.id);
    if (pattern) {
        res.json(pattern);
    }
    else {
        res.status(404).json({ error: 'Demand pattern not found' });
    }
});
// Resonance endpoint
app.post('/api/calculate-resonance', (req, res) => {
    const { productId, patternId } = req.body;
    const product = mockData_1.mockProducts.find((p) => p.id === productId);
    const pattern = mockData_1.mockDemandPatterns.find((p) => p.id === patternId);
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
//# sourceMappingURL=server.js.map