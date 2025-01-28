import puppeteer from 'puppeteer';
import { logger } from '../utils/logger';

async function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function signupForAffiliatePrograms(): Promise<void> {
  // Launch with Chrome's normal window
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    args: ['--start-maximized'],
  });

  const page = await browser.newPage();

  // Make it look real
  await page.setViewport({ width: 1920, height: 1080 });
  await page.setUserAgent(
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36'
  );

  // Human-like typing
  const humanType = async (selector: string, text: string): Promise<void> => {
    await page.waitForSelector(selector, { visible: true });
    await page.click(selector);
    for (const char of text) {
      await page.keyboard.type(char);
      await delay(Math.random() * 150 + 50); // Random delay between keystrokes
    }
  };

  try {
    // Awin Network (owns ShareASale)
    logger.info('Starting Awin signup process...');
    await page.goto('https://www.awin.com/us/publishers/signup', { waitUntil: 'networkidle0' });
    await delay(2000);

    // Fill publisher signup form
    await humanType('input[name="firstName"]', 'Dean');
    await humanType('input[name="lastName"]', 'Stamos');
    await humanType('input[name="email"]', 'dean@divvytech.com');
    await humanType('input[name="website"]', 'divvytech.com');

    logger.info('Filled Awin form');
    await delay(3000);

    // CJ Affiliate (Commission Junction)
    logger.info('Starting CJ Affiliate signup process...');
    await page.goto('https://signup.cj.com/member/signup/publisher', { waitUntil: 'networkidle0' });
    await delay(2000);

    // Fill publisher signup form
    await humanType('#firstName', 'Dean');
    await humanType('#lastName', 'Stamos');
    await humanType('#email', 'dean@divvytech.com');
    await humanType('#websiteUrl', 'divvytech.com');

    logger.info('Filled CJ form');
    await delay(3000);

    // FlexOffers
    logger.info('Starting FlexOffers signup process...');
    await page.goto('https://publishers.flexoffers.com/signup', { waitUntil: 'networkidle0' });
    await delay(2000);

    // Fill signup form
    await humanType('input[name="firstName"]', 'Dean');
    await humanType('input[name="lastName"]', 'Stamos');
    await humanType('input[name="email"]', 'dean@divvytech.com');
    await humanType('input[name="website"]', 'divvytech.com');

    logger.info('Filled FlexOffers form');
    await delay(3000);
  } catch (error) {
    logger.error('Error during affiliate signup:', error);
  } finally {
    logger.info('Completed signup attempts. Keeping browser open for review...');
    await delay(10000); // Keep open to see results
    await browser.close();
  }
}

signupForAffiliatePrograms();
