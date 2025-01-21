import puppeteer from 'puppeteer';

async function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function signupForAffiliatePrograms() {
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
  const humanType = async (selector: string, text: string) => {
    await page.waitForSelector(selector, { visible: true });
    await page.click(selector);
    for (const char of text) {
      await page.keyboard.type(char);
      await delay(Math.random() * 150 + 50); // Random delay between keystrokes
    }
  };

  console.log('Starting affiliate signups...');

  // Awin Network (owns ShareASale)
  try {
    console.log('Accessing Awin...');
    await page.goto('https://www.awin.com/us/publishers/signup', { waitUntil: 'networkidle0' });
    await delay(2000);

    // Fill publisher signup form
    await humanType('input[name="firstName"]', 'Dean');
    await humanType('input[name="lastName"]', 'Stamos');
    await humanType('input[name="email"]', 'dean@divvytech.com');
    await humanType('input[name="website"]', 'divvytech.com');

    console.log('Filled Awin form');
    await delay(3000);
  } catch (error) {
    console.error('Awin error:', error);
  }

  // CJ Affiliate (Commission Junction)
  try {
    console.log('Accessing CJ Affiliate...');
    await page.goto('https://signup.cj.com/member/signup/publisher', { waitUntil: 'networkidle0' });
    await delay(2000);

    // Fill publisher signup form
    await humanType('#firstName', 'Dean');
    await humanType('#lastName', 'Stamos');
    await humanType('#email', 'dean@divvytech.com');
    await humanType('#websiteUrl', 'divvytech.com');

    console.log('Filled CJ form');
    await delay(3000);
  } catch (error) {
    console.error('CJ error:', error);
  }

  // FlexOffers
  try {
    console.log('Accessing FlexOffers...');
    await page.goto('https://publishers.flexoffers.com/signup', { waitUntil: 'networkidle0' });
    await delay(2000);

    // Fill signup form
    await humanType('input[name="firstName"]', 'Dean');
    await humanType('input[name="lastName"]', 'Stamos');
    await humanType('input[name="email"]', 'dean@divvytech.com');
    await humanType('input[name="website"]', 'divvytech.com');

    console.log('Filled FlexOffers form');
    await delay(3000);
  } catch (error) {
    console.error('FlexOffers error:', error);
  }

  console.log('Completed signup attempts. Keeping browser open for review...');
  await delay(10000); // Keep open to see results
  await browser.close();
}

signupForAffiliatePrograms();
