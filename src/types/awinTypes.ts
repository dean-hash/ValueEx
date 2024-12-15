export interface AwinProduct {
    id: string;
    title: string;
    description: string;
    price: number;
    currency: string;
    merchant: {
        id: string;
        name: string;
    };
    categories: string[];
    url: string;
    imageUrl: string;
    resonanceScore?: number;
}

export interface AwinSearchParams {
    keyword: string;
    categoryId?: string;
    minPrice?: number;
    maxPrice?: number;
    merchantId?: string;
    limit?: number;
    offset?: number;
}
