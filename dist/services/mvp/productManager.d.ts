import { MVPProduct, ProductMatchCriteria } from '../../types/mvp/product';
/**
 * MVP Product Manager
 * Handles manual product management and basic matching logic
 * Can be extended later for API integrations
 */
export declare class ProductManager {
    private static instance;
    private products;
    private constructor();
    static getInstance(): ProductManager;
    /**
     * Add or update a product
     * Simple in MVP, but maintains structure for future enhancements
     */
    addProduct(product: Omit<MVPProduct, 'id' | 'resonanceFactors'>): Promise<MVPProduct>;
    /**
     * Find products matching demand criteria
     * Simple matching for MVP, but structured for future enhancement
     */
    findMatches(criteria: ProductMatchCriteria): MVPProduct[];
    /**
     * Get all products (for MVP admin interface)
     */
    getAllProducts(): MVPProduct[];
    /**
     * Update product status
     */
    updateProductStatus(id: string, status: MVPProduct['status']): boolean;
    /**
     * Clear all products (for testing)
     */
    clearProducts(): void;
}
