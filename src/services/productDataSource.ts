import { AwinProduct } from '../types/awinTypes';
import { logger } from '../utils/logger';
import puppeteer from 'puppeteer';

export interface ScrapedProduct {
  title: string;
  price: number;
  currency: string;
  description: string;
  merchant: {
    name: string;
    id: string;
  };
  categories: string[];
  url: string;
  imageUrl: string;
}

export class ProductDataSource {
  private static readonly AMAZON_SELECTOR = {
    title: 'span#productTitle',
    price: 'span.a-price-whole',
    description: 'div#productDescription',
    merchant: 'a#bylineInfo',
    category: 'a.a-link-normal.a-color-tertiary',
  };

  private static readonly EBAY_SELECTOR = {
    title: 'h1.x-item-title__mainTitle',
    price: 'div.x-price-primary span',
    description: 'div.x-item-description',
    merchant: 'div.x-seller-info',
    category: 'nav.breadcrumbs span',
  };

  async getProductData(url: string): Promise<ScrapedProduct> {
    try {
      const browser = await puppeteer.launch({ headless: true });
      const page = await browser.newPage();
      await page.goto(url);

      const product = await this.scrapeProductData(page, url);
      await browser.close();
      return product;
    } catch (error) {
      logger.error('Error scraping product data:', error);
      throw error;
    }
  }

  private async scrapeProductData(page: any, url: string): Promise<ScrapedProduct> {
    const selectors = url.includes('amazon')
      ? ProductDataSource.AMAZON_SELECTOR
      : ProductDataSource.EBAY_SELECTOR;

    const rawPrice = await page.$eval(selectors.price, (el: any) => el.textContent);
    const price = parseFloat(rawPrice.replace(/[^0-9.]/g, ''));

    return {
      title: await page.$eval(selectors.title, (el: any) => el.textContent.trim()),
      price,
      currency: 'USD', // Default for now, could be detected
      description: await page.$eval(selectors.description, (el: any) => el.textContent.trim()),
      merchant: {
        name: await page.$eval(selectors.merchant, (el: any) => el.textContent.trim()),
        id: 'scraped-' + Buffer.from(url).toString('base64').slice(0, 10),
      },
      categories: await page.$$eval(selectors.category, (elements: any[]) =>
        elements.map((el) => el.textContent.trim())
      ),
      url,
      imageUrl: await page.$eval('img', (img: any) => img.src),
    };
  }

  // Convert scraped product to our internal AwinProduct format
  convertToAwinProduct(scraped: ScrapedProduct): AwinProduct {
    return {
      id: scraped.merchant.id,
      title: scraped.title,
      description: scraped.description,
      price: scraped.price,
      currency: scraped.currency,
      merchant: {
        id: scraped.merchant.id,
        name: scraped.merchant.name,
      },
      categories: scraped.categories,
      url: scraped.url,
      imageUrl: scraped.imageUrl,
    };
  }
}
