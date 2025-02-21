"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductDataSource = void 0;
const logger_1 = require("../utils/logger");
const puppeteer_1 = __importDefault(require("puppeteer"));
class ProductDataSource {
    async getProductData(url) {
        try {
            const browser = await puppeteer_1.default.launch({ headless: true });
            const page = await browser.newPage();
            await page.goto(url);
            const product = await this.scrapeProductData(page, url);
            await browser.close();
            return product;
        }
        catch (error) {
            logger_1.logger.error('Error scraping product data:', error);
            throw error;
        }
    }
    async scrapeProductData(page, url) {
        const selectors = url.includes('amazon')
            ? ProductDataSource.AMAZON_SELECTOR
            : ProductDataSource.EBAY_SELECTOR;
        const rawPrice = await page.$eval(selectors.price, (el) => el.textContent);
        const price = parseFloat(rawPrice.replace(/[^0-9.]/g, ''));
        return {
            title: await page.$eval(selectors.title, (el) => el.textContent.trim()),
            price,
            currency: 'USD', // Default for now, could be detected
            description: await page.$eval(selectors.description, (el) => el.textContent.trim()),
            merchant: {
                name: await page.$eval(selectors.merchant, (el) => el.textContent.trim()),
                id: 'scraped-' + Buffer.from(url).toString('base64').slice(0, 10),
            },
            categories: await page.$$eval(selectors.category, (elements) => elements.map((el) => el.textContent.trim())),
            url,
            imageUrl: await page.$eval('img', (img) => img.src),
        };
    }
    // Convert scraped product to our internal AwinProduct format
    convertToAwinProduct(scraped) {
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
exports.ProductDataSource = ProductDataSource;
ProductDataSource.AMAZON_SELECTOR = {
    title: 'span#productTitle',
    price: 'span.a-price-whole',
    description: 'div#productDescription',
    merchant: 'a#bylineInfo',
    category: 'a.a-link-normal.a-color-tertiary',
};
ProductDataSource.EBAY_SELECTOR = {
    title: 'h1.x-item-title__mainTitle',
    price: 'div.x-price-primary span',
    description: 'div.x-item-description',
    merchant: 'div.x-seller-info',
    category: 'nav.breadcrumbs span',
};
//# sourceMappingURL=productDataSource.js.map