const { chromium } = require('playwright');

async function check() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
  });

  // Dashboard
  await page.goto('http://127.0.0.1:5700/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  console.log('=== Dashboard ===');
  console.log(await page.content());
  
  // Tasks
  await page.goto('http://127.0.0.1:5700/tasks', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  console.log('\n=== Tasks ===');
  const tasksHeader = await page.locator('h1, h2, .text-lg, .font-semibold').allTextContents();
  console.log('Headers:', tasksHeader);
  
  await browser.close();
  console.log('\nErrors:', errors.length);
  errors.forEach(e => console.log(' -', e.substring(0, 100)));
}

check();
