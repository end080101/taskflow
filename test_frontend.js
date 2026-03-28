const { chromium } = require('playwright');

async function test() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  const results = [];
  
  // Listen for console errors
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });
  
  page.on('pageerror', err => {
    errors.push(err.message);
  });

  try {
    // Test 1: Dashboard
    console.log('Testing Dashboard...');
    await page.goto('http://127.0.0.1:5700/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    const dashTitle = await page.locator('text=仪表盘').first().isVisible().catch(() => false);
    results.push({ test: 'Dashboard', passed: dashTitle, detail: dashTitle ? '仪表盘可见' : '未找到仪表盘' });

    // Test 2: Tasks page
    console.log('Testing Tasks...');
    await page.goto('http://127.0.0.1:5700/tasks', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    const tasksTitle = await page.locator('text=定时任务').first().isVisible().catch(() => false);
    const newTaskBtn = await page.locator('text=新建任务').first().isVisible().catch(() => false);
    results.push({ test: 'Tasks页面', passed: tasksTitle, detail: '定时任务' + (newTaskBtn ? ' + 新建按钮' : '') });

    // Test 3: Scripts page
    console.log('Testing Scripts...');
    await page.goto('http://127.0.0.1:5700/scripts', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    const scriptsTitle = await page.locator('text=脚本文件').first().isVisible().catch(() => false);
    results.push({ test: 'Scripts页面', passed: scriptsTitle, detail: scriptsTitle ? '脚本文件可见' : '未找到' });

    // Test 4: Logs page
    console.log('Testing Logs...');
    await page.goto('http://127.0.0.1:5700/logs', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    const logsTitle = await page.locator('text=执行日志').first().isVisible().catch(() => false);
    results.push({ test: 'Logs页面', passed: logsTitle, detail: logsTitle ? '执行日志可见' : '未找到' });

    // Test 5: Envs page
    console.log('Testing Envs...');
    await page.goto('http://127.0.0.1:5700/envs', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    const envsTitle = await page.locator('text=环境变量').first().isVisible().catch(() => false);
    const addEnvBtn = await page.locator('text=新增变量').first().isVisible().catch(() => false);
    results.push({ test: 'Envs页面', passed: envsTitle, detail: '环境变量' + (addEnvBtn ? ' + 新增按钮' : '') });

    // Test 6: Dependencies page
    console.log('Testing Dependencies...');
    await page.goto('http://127.0.0.1:5700/dependencies', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    const depsTitle = await page.locator('text=依赖管理').first().isVisible().catch(() => false);
    const addDepBtn = await page.locator('text=添加依赖').first().isVisible().catch(() => false);
    results.push({ test: 'Dependencies页面', passed: depsTitle, detail: '依赖管理' + (addDepBtn ? ' + 添加按钮' : '') });

    // Test 7: Settings page
    console.log('Testing Settings...');
    await page.goto('http://127.0.0.1:5700/settings', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    const sysInfo = await page.locator('text=系统信息').first().isVisible().catch(() => false);
    const notifySection = await page.locator('text=通知设置').first().isVisible().catch(() => false);
    const mirrorSection = await page.locator('text=镜像源配置').first().isVisible().catch(() => false);
    results.push({ test: 'Settings页面', passed: sysInfo && notifySection, detail: '系统信息:' + sysInfo + ' 通知设置:' + notifySection + ' 镜像配置:' + mirrorSection });

    // Test 8: Sidebar Navigation
    console.log('Testing Sidebar...');
    const sidebarItems = await page.locator('nav a').count();
    results.push({ test: '侧边栏导航', passed: sidebarItems >= 7, detail: sidebarItems + ' 个导航项' });

    // Test 9: Click Tasks link from sidebar
    console.log('Testing Navigation...');
    await page.goto('http://127.0.0.1:5700/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);
    await page.locator('a[href="/tasks"]').click();
    await page.waitForTimeout(1000);
    const onTasksPage = await page.url();
    results.push({ test: '侧边栏跳转', passed: onTasksPage.includes('/tasks'), detail: 'URL: ' + onTasksPage });

    // Test 10: Open Task Modal
    console.log('Testing Task Modal...');
    await page.locator('text=新建任务').click();
    await page.waitForTimeout(500);
    const modalVisible = await page.locator('text=任务名称').first().isVisible().catch(() => false);
    results.push({ test: '新建任务弹窗', passed: modalVisible, detail: modalVisible ? '弹窗已打开' : '弹窗未显示' });
    
    // Close modal
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);

    // Test 11: Open Env Modal
    console.log('Testing Env Modal...');
    await page.goto('http://127.0.0.1:5700/envs', { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);
    await page.locator('text=新增变量').click();
    await page.waitForTimeout(500);
    const envModalVisible = await page.locator('text=变量名').first().isVisible().catch(() => false);
    results.push({ test: '新增变量弹窗', passed: envModalVisible, detail: envModalVisible ? '弹窗已打开' : '弹窗未显示' });

  } catch (err) {
    results.push({ test: '测试异常', passed: false, detail: err.message });
  }

  await browser.close();

  // Print results
  console.log('\n========================================');
  console.log('         前端功能测试结果');
  console.log('========================================');
  results.forEach(r => {
    const status = r.passed ? '✅' : '❌';
    console.log(`${status} ${r.test}: ${r.detail}`);
  });
  console.log('========================================');
  console.log(`控制台错误: ${errors.length} 个`);
  if (errors.length > 0) {
    errors.slice(0, 5).forEach(e => console.log('  - ' + e.substring(0, 100)));
  }
  console.log('========================================\n');
  
  const passed = results.filter(r => r.passed).length;
  console.log(`通过: ${passed}/${results.length}`);
  
  process.exit(passed === results.length ? 0 : 1);
}

test();
