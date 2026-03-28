const { chromium } = require('playwright');

async function test() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error' && !msg.text().includes('favicon')) {
      errors.push(msg.text());
    }
  });
  
  const results = [];
  
  const testPage = async (name, url, checks) => {
    console.log(`Testing ${name}...`);
    errors.length = 0;
    await page.goto(url, { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(2000);
    
    const pageErrors = [...errors];
    let passed = true;
    let details = [];
    
    for (const check of checks) {
      const found = await page.locator(check).first().isVisible().catch(() => false);
      if (!found) passed = false;
      details.push(`${check}: ${found ? '✅' : '❌'}`);
    }
    
    if (pageErrors.length > 0) {
      details.push(`Errors: ${pageErrors.length}`);
      passed = false;
    }
    
    results.push({ test: name, passed, detail: details.join(', ') });
  };
  
  try {
    await testPage('Dashboard', 'http://127.0.0.1:5700/', [
      'text=仪表盘',
      'text=定时任务',
      'text=环境变量',
    ]);
    
    await testPage('Tasks', 'http://127.0.0.1:5700/tasks', [
      'text=定时任务',
      'text=新建任务',
    ]);
    
    await testPage('Envs', 'http://127.0.0.1:5700/envs', [
      'text=环境变量',
      'text=新增变量',
    ]);
    
    await testPage('Scripts', 'http://127.0.0.1:5700/scripts', [
      'text=脚本文件',
    ]);
    
    await testPage('Logs', 'http://127.0.0.1:5700/logs', [
      'text=执行日志',
    ]);
    
    await testPage('Dependencies', 'http://127.0.0.1:5700/dependencies', [
      'text=依赖管理',
      'text=添加依赖',
    ]);
    
    await testPage('Settings', 'http://127.0.0.1:5700/settings', [
      'text=系统信息',
      'text=通知设置',
      'text=镜像源配置',
    ]);
    
    // Test sidebar navigation
    console.log('Testing Sidebar...');
    await page.goto('http://127.0.0.1:5700/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    const navLinks = await page.locator('nav a').count();
    results.push({ test: '侧边栏导航', passed: navLinks >= 7, detail: `${navLinks} 个链接` });
    
    // Test modal opens
    console.log('Testing Task Modal...');
    await page.goto('http://127.0.0.1:5700/tasks', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    await page.locator('text=新建任务').click();
    await page.waitForTimeout(500);
    const modal = await page.locator('text=任务名称').isVisible().catch(() => false);
    results.push({ test: '新建任务弹窗', passed: modal, detail: modal ? '✅' : '❌' });
    await page.keyboard.press('Escape');
    
  } catch (err) {
    results.push({ test: 'Exception', passed: false, detail: err.message.substring(0, 50) });
  }
  
  await browser.close();
  
  console.log('\n========================================');
  console.log('         前端功能测试结果');
  console.log('========================================');
  results.forEach(r => {
    console.log(`${r.passed ? '✅' : '❌'} ${r.test}: ${r.detail}`);
  });
  console.log('========================================');
  
  const passed = results.filter(r => r.passed).length;
  console.log(`\n通过: ${passed}/${results.length}`);
}

test();
