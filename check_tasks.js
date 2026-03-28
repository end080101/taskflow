const { chromium } = require('playwright');

async function check() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('Console Error:', msg.text().substring(0, 150));
    }
  });
  
  page.on('response', response => {
    if (response.status() >= 400) {
      console.log(`Network Error: ${response.status()} - ${response.url()}`);
    }
  });
  
  await page.goto('http://127.0.0.1:5700/tasks', { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(3000);
  
  console.log('\n=== Page Content ===');
  const content = await page.content();
  console.log(content.substring(0, 2000));
  
  await browser.close();
}

check();
