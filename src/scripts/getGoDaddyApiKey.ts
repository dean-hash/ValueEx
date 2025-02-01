import puppeteer from 'puppeteer';
import dotenv from 'dotenv';

dotenv.config();

async function getGoDaddyApiKey(): Promise<{ key: string; secret: string }> {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    args: [
      '--start-maximized',
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-infobars',
      '--window-position=0,0',
      '--ignore-certificate-errors',
      '--ignore-certificate-errors-spki-list',
      '--disable-web-security',
      '--disable-features=IsolateOrigins,site-per-process',
      '--disable-blink-features=AutomationControlled',
    ],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });

    // Mask automation
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'webdriver', {
        get: () => false,
      });
      // @ts-ignore
      window.chrome = {
        runtime: {},
      };
    });

    // Navigate to GoDaddy SSO
    await page.goto('https://sso.godaddy.com/', { waitUntil: 'networkidle0' });

    // Wait for login form and enter credentials
    await page.waitForSelector('#username');
    await page.waitForSelector('#password');

    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );

    await page.type('#username', process.env.GODADDY_USERNAME!, { delay: 100 });
    await page.type('#password', process.env.GODADDY_PASSWORD!, { delay: 100 });

    await page.click('#submitBtn');

    // Wait for authentication to complete
    await new Promise((resolve) => setTimeout(resolve, 5000));

    // Navigate to developer portal
    await page.goto('https://developer.godaddy.com/keys', { waitUntil: 'networkidle0' });

    // Create new API key if needed
    const createKeyButton = await page.$('.create-key-button');
    if (createKeyButton) {
      await createKeyButton.click();
      await page.waitForSelector('input[name="name"]');
      await page.type('input[name="name"]', 'ValueEx Integration', { delay: 100 });
      await page.click('.submit-button');
    }

    // Get API key and secret
    await page.waitForSelector('.key-text');
    await page.waitForSelector('.secret-text');

    const apiKey = await page.$eval('.key-text', (el) => el.textContent?.trim() || '');
    const apiSecret = await page.$eval('.secret-text', (el) => el.textContent?.trim() || '');

    console.log('API Key:', apiKey);
    console.log('API Secret:', apiSecret);

    // Update .env file
    const fs = require('fs');
    const envContent = fs.readFileSync('.env', 'utf8');
    const updatedContent = envContent
      .replace(/^GODADDY_API_KEY=.*$/m, `GODADDY_API_KEY=${apiKey}`)
      .replace(/^GODADDY_API_SECRET=.*$/m, `GODADDY_API_SECRET=${apiSecret}`);
    fs.writeFileSync('.env', updatedContent);

    console.log('Credentials updated in .env file');

    return { key: apiKey, secret: apiSecret };
  } catch (error) {
    console.error('Failed to get GoDaddy API key:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

getGoDaddyApiKey().catch(console.error);
