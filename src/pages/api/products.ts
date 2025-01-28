import { NextApiRequest, NextApiResponse } from 'next';
import { ProductSourcing } from '../../services/product/productSourcing';
import { logger } from '../../utils/logger';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  tags: string[];
  url: string;
}

interface ProductResponse {
  products: Product[];
  totalCount: number;
  page: number;
  pageSize: number;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ProductResponse>
): Promise<void> {
  if (req.method !== 'GET') {
    res.status(405).json({
      products: [],
      totalCount: 0,
      page: 1,
      pageSize: 10,
    });
    return;
  }

  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 10;
    const category = req.query.category as string;

    const sourcing = ProductSourcing.getInstance();
    const products = await sourcing.getProducts({ page, pageSize, category });

    res.status(200).json({
      products,
      totalCount: products.length,
      page,
      pageSize,
    });
  } catch (error) {
    logger.error('Error in products endpoint:', error);
    res.status(500).json({
      products: [],
      totalCount: 0,
      page: 1,
      pageSize: 10,
    });
  }
}
