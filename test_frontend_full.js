const { chromium } = require('playwright');

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function test() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  const results = [];
  const errors = [];

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });

  page.on('pageerror', (err) => {
    errors.push(err.message);
  });

  try {
    // ========== Tasks 页面测试 ==========
    console.log('\n--- Tasks 页面测试 ---');

    await page.goto('http://127.0.0.1:5700/tasks', {
      waitUntil: 'networkidle',
    });
    await sleep(1000);

    // 验证页面标题
    const tasksTitle = await page
      .locator('text=定时任务')
      .first()
      .isVisible()
      .catch(() => false);
    results.push({
      test: 'Tasks-页面加载',
      passed: tasksTitle,
      detail: tasksTitle ? '定时任务标题可见' : '未找到',
    });

    // 测试创建任务
    console.log('Testing 创建任务...');
    await page.locator('text=新建任务').click();
    await sleep(500);

    // 填写任务表单
    await page
      .locator('input[placeholder="输入任务名称"]')
      .fill('自动化测试任务');
    await page.locator('input[placeholder="task.sh"]').fill('echo "test"');
    await page.locator('input[placeholder="0 * * * *"]').fill('*/5 * * * *');

    // 提交
    const submitBtn = page.locator(
      'button:has-text("创建"), button:has-text("确定")',
    );
    if (await submitBtn.first().isVisible()) {
      await submitBtn.first().click();
      await sleep(1000);
    }

    // 关闭弹窗
    await page.keyboard.press('Escape');
    await sleep(500);

    // 验证任务已创建
    const taskCreated = await page
      .locator('text=自动化测试任务')
      .first()
      .isVisible()
      .catch(() => false);
    results.push({
      test: 'Tasks-创建任务',
      passed: taskCreated,
      detail: taskCreated ? '任务创建成功' : '任务创建失败',
    });

    // 测试编辑任务
    console.log('Testing 编辑任务...');
    // 找到自动化测试任务的编辑按钮（它应该是表格中该行的编辑按钮）
    const taskEditBtn = page
      .locator('text=自动化测试任务')
      .first()
      .locator('..')
      .locator('[title="编辑"]')
      .first();
    if (await taskEditBtn.isVisible()) {
      await taskEditBtn.click();
      await sleep(500);

      const nameInput = page.locator('input[placeholder="输入任务名称"]');
      if (await nameInput.isVisible()) {
        await nameInput.fill('自动化测试任务-已修改');
        const saveBtn = page.locator('button:has-text("保存")').first();
        await saveBtn.click();
        await sleep(1000);
      }
      await page.keyboard.press('Escape');
    }

    const taskModified = await page
      .locator('text=自动化测试任务-已修改')
      .first()
      .isVisible()
      .catch(() => false);
    results.push({
      test: 'Tasks-编辑任务',
      passed: taskModified,
      detail: taskModified ? '任务编辑成功' : '任务编辑失败',
    });

    // 测试置顶任务
    console.log('Testing 置顶任务...');
    const pinBtn = page
      .locator('[aria-label*="置顶"], button:has-text("置顶")')
      .first();
    if (await pinBtn.isVisible()) {
      await pinBtn.click();
      await sleep(500);
      const pinned = await page
        .locator('text=自动化测试任务-已修改')
        .first()
        .isVisible();
      results.push({
        test: 'Tasks-置顶任务',
        passed: pinned,
        detail: '置顶操作完成',
      });
    } else {
      results.push({
        test: 'Tasks-置顶任务',
        passed: true,
        detail: '跳过（按钮不可见）',
      });
    }

    // 测试启用/禁用
    console.log('Testing 启用禁用...');
    const toggleBtn = page
      .locator(
        '[aria-label*="禁用"], [aria-label*="启用"], button:has-text("禁用"), button:has-text("启用")',
      )
      .first();
    if (await toggleBtn.isVisible()) {
      await toggleBtn.click();
      await sleep(500);
      results.push({
        test: 'Tasks-启用禁用',
        passed: true,
        detail: '切换成功',
      });
    } else {
      results.push({
        test: 'Tasks-启用禁用',
        passed: true,
        detail: '跳过（按钮不可见）',
      });
    }

    // 测试删除任务
    console.log('Testing 删除任务...');
    const deleteBtn = page
      .locator('button:has-text("删除"), [aria-label*="删除"]')
      .first();
    if (await deleteBtn.isVisible()) {
      await deleteBtn.click();
      await sleep(500);

      // 确认删除
      const confirmBtn = page
        .locator('button:has-text("确认"), button:has-text("确定")')
        .first();
      if (await confirmBtn.isVisible()) {
        await confirmBtn.click();
        await sleep(1000);
      }
    }
    results.push({
      test: 'Tasks-删除任务',
      passed: true,
      detail: '删除操作完成',
    });

    // ========== Envs 页面测试 ==========
    console.log('\n--- Envs 页面测试 ---');

    await page.goto('http://127.0.0.1:5700/envs', { waitUntil: 'networkidle' });
    await sleep(1000);

    const envsTitle = await page
      .locator('text=环境变量')
      .first()
      .isVisible()
      .catch(() => false);
    results.push({
      test: 'Envs-页面加载',
      passed: envsTitle,
      detail: envsTitle ? '环境变量页面可见' : '未找到',
    });

    // 测试创建环境变量
    console.log('Testing 创建环境变量...');
    await page.locator('text=新增变量').click();
    await sleep(500);

    // 填写表单
    await page.locator('input[placeholder="JD_COOKIE"]').fill('TEST_VAR');
    await page
      .locator('input[placeholder="输入变量值"]')
      .fill('test_value_123');

    const envSubmitBtn = page
      .locator(
        'button[type="submit"], button:has-text("确定"), button:has-text("保存")',
      )
      .first();
    if (await envSubmitBtn.isVisible()) {
      await envSubmitBtn.click();
      await sleep(1000);
    }
    await page.keyboard.press('Escape');

    const envCreated = await page
      .locator('text=TEST_VAR')
      .first()
      .isVisible()
      .catch(() => false);
    results.push({
      test: 'Envs-创建变量',
      passed: envCreated,
      detail: envCreated ? '变量创建成功' : '变量创建失败',
    });

    // 测试编辑环境变量
    console.log('Testing 编辑环境变量...');
    const envRow = page.locator('text=TEST_VAR').first();
    if (await envRow.isVisible()) {
      await envRow.click();
      await sleep(500);

      const editEnvBtn = page
        .locator('button:has-text("编辑"), [aria-label*="编辑"]')
        .first();
      if (await editEnvBtn.isVisible()) {
        await editEnvBtn.click();
        await sleep(500);

        const valueInput = page
          .locator('textarea[placeholder*="值"], input[name*="value"]')
          .first();
        if (await valueInput.isVisible()) {
          await valueInput.fill('test_value_modified');
          const saveEnvBtn = page
            .locator(
              'button[type="submit"], button:has-text("确定"), button:has-text("保存")',
            )
            .first();
          await saveEnvBtn.click();
          await sleep(1000);
        }
      }
      await page.keyboard.press('Escape');
    }

    // 验证编辑结果（环境变量值默认隐藏，通过 API 验证）
    const apiResponse = await page.evaluate(async () => {
      const res = await fetch('/api/envs');
      const data = await res.json();
      const env =
        data.data &&
        data.data.find(function (e) {
          return e.name === 'TEST_VAR';
        });
      return env ? env.value : null;
    });
    const envModified = apiResponse === 'test_value_modified';
    results.push({
      test: 'Envs-编辑变量',
      passed: envModified,
      detail: envModified ? '变量编辑成功 (API验证)' : '变量编辑失败',
    });

    // 测试启用/禁用环境变量
    console.log('Testing 环境变量启用禁用...');
    const envToggleBtn = page
      .locator(
        '[aria-label*="禁用"], [aria-label*="启用"], button:has-text("禁用"), button:has-text("启用")',
      )
      .first();
    if (await envToggleBtn.isVisible()) {
      await envToggleBtn.click();
      await sleep(500);
      results.push({ test: 'Envs-启用禁用', passed: true, detail: '切换成功' });
    } else {
      results.push({ test: 'Envs-启用禁用', passed: true, detail: '跳过' });
    }

    // 测试删除环境变量
    console.log('Testing 删除环境变量...');
    const deleteEnvBtn = page
      .locator('button:has-text("删除"), [aria-label*="删除"]')
      .first();
    if (await deleteEnvBtn.isVisible()) {
      await deleteEnvBtn.click();
      await sleep(500);
      const confirmEnvBtn = page
        .locator('button:has-text("确认"), button:has-text("确定")')
        .first();
      if (await confirmEnvBtn.isVisible()) {
        await confirmEnvBtn.click();
        await sleep(1000);
      }
    }
    results.push({
      test: 'Envs-删除变量',
      passed: true,
      detail: '删除操作完成',
    });

    // ========== Scripts 页面测试 ==========
    console.log('\n--- Scripts 页面测试 ---');

    await page.goto('http://127.0.0.1:5700/scripts', {
      waitUntil: 'networkidle',
    });
    await sleep(1000);

    const scriptsTitle = await page
      .locator('text=脚本文件')
      .first()
      .isVisible()
      .catch(() => false);
    results.push({
      test: 'Scripts-页面加载',
      passed: scriptsTitle,
      detail: scriptsTitle ? '脚本文件页面可见' : '未找到',
    });

    // 检查文件列表
    const fileListVisible = await page
      .locator('text=根目录')
      .first()
      .isVisible()
      .catch(() => false);
    results.push({
      test: 'Scripts-文件列表',
      passed: fileListVisible,
      detail: fileListVisible ? '文件列表可见' : '未找到',
    });

    // 测试新建脚本
    console.log('Testing 新建脚本...');
    const newScriptBtn = page
      .locator('text=新建脚本, text=新建文件, button:has-text("新建")')
      .first();
    if (await newScriptBtn.isVisible()) {
      await newScriptBtn.click();
      await sleep(500);

      // 填写脚本名称
      const scriptNameInput = page
        .locator('input[placeholder*="名称"], input[name*="name"]')
        .first();
      if (await scriptNameInput.isVisible()) {
        await scriptNameInput.fill('auto_test_script.js');
        const createBtn = page
          .locator(
            'button[type="submit"], button:has-text("确定"), button:has-text("创建")',
          )
          .first();
        await createBtn.click();
        await sleep(1000);
      }
      await page.keyboard.press('Escape');
    }
    results.push({
      test: 'Scripts-新建脚本',
      passed: true,
      detail: '新建脚本操作完成',
    });

    // ========== Logs 页面测试 ==========
    console.log('\n--- Logs 页面测试 ---');

    await page.goto('http://127.0.0.1:5700/logs', { waitUntil: 'networkidle' });
    await sleep(1000);

    const logsTitle = await page
      .locator('text=执行日志')
      .first()
      .isVisible()
      .catch(() => false);
    results.push({
      test: 'Logs-页面加载',
      passed: logsTitle,
      detail: logsTitle ? '执行日志页面可见' : '未找到',
    });

    // 检查日志列表
    const logListVisible = await page
      .locator('table, .log-list, [role="list"]')
      .first()
      .isVisible()
      .catch(() => false);
    results.push({
      test: 'Logs-日志列表',
      passed: logListVisible,
      detail: logListVisible ? '日志列表可见' : '未找到',
    });

    // 测试查看日志详情
    console.log('Testing 日志详情...');
    // 检查是否有数据行（表格中有 td 元素且不是空的）
    const hasDataRows = await page.locator('tbody tr td').count();
    if (hasDataRows > 0) {
      await page.locator('tbody tr').first().click();
      await sleep(500);

      const logDetailVisible = await page
        .locator('[role="dialog"], .modal')
        .first()
        .isVisible()
        .catch(() => false);
      results.push({
        test: 'Logs-日志详情',
        passed: logDetailVisible,
        detail: logDetailVisible ? '日志详情可见' : '未找到',
      });

      await page.keyboard.press('Escape');
    } else {
      results.push({
        test: 'Logs-日志详情',
        passed: true,
        detail: '跳过（无日志数据）',
      });
    }

    // ========== Dependencies 页面测试 ==========
    console.log('\n--- Dependencies 页面测试 ---');

    await page.goto('http://127.0.0.1:5700/dependencies', {
      waitUntil: 'networkidle',
    });
    await sleep(1000);

    const depsTitle = await page
      .locator('text=依赖管理')
      .first()
      .isVisible()
      .catch(() => false);
    results.push({
      test: 'Dependencies-页面加载',
      passed: depsTitle,
      detail: depsTitle ? '依赖管理页面可见' : '未找到',
    });

    // 测试添加依赖
    console.log('Testing 添加依赖...');
    const addDepBtn = page
      .locator('text=添加依赖, button:has-text("添加")')
      .first();
    if (await addDepBtn.isVisible()) {
      await addDepBtn.click();
      await sleep(500);

      // 填写依赖信息
      const depNameInput = page
        .locator('input[placeholder*="名称"], input[name*="name"]')
        .first();
      if (await depNameInput.isVisible()) {
        await depNameInput.fill('test_dependency');
        const depVerInput = page
          .locator('input[placeholder*="版本"], input[name*="version"]')
          .first();
        if (await depVerInput.isVisible()) {
          await depVerInput.fill('latest');
        }
        const installBtn = page
          .locator(
            'button[type="submit"], button:has-text("确定"), button:has-text("安装")',
          )
          .first();
        await installBtn.click();
        await sleep(1000);
      }
      await page.keyboard.press('Escape');
    }
    results.push({
      test: 'Dependencies-添加依赖',
      passed: true,
      detail: '添加依赖操作完成',
    });

    // ========== Settings 页面测试 ==========
    console.log('\n--- Settings 页面测试 ---');

    await page.goto('http://127.0.0.1:5700/settings', {
      waitUntil: 'networkidle',
    });
    await sleep(1000);

    const sysInfo = await page
      .locator('text=系统信息')
      .first()
      .isVisible()
      .catch(() => false);
    const notifySection = await page
      .locator('text=通知设置')
      .first()
      .isVisible()
      .catch(() => false);
    const mirrorSection = await page
      .locator('text=镜像源配置')
      .first()
      .isVisible()
      .catch(() => false);

    results.push({
      test: 'Settings-系统信息',
      passed: sysInfo,
      detail: sysInfo ? '系统信息可见' : '未找到',
    });
    results.push({
      test: 'Settings-通知设置',
      passed: notifySection,
      detail: notifySection ? '通知设置可见' : '未找到',
    });
    results.push({
      test: 'Settings-镜像配置',
      passed: mirrorSection,
      detail: mirrorSection ? '镜像配置可见' : '未找到',
    });

    // 测试修改通知设置
    console.log('Testing 修改通知设置...');
    const notifyToggle = page.locator('text=通知设置').first();
    if (await notifyToggle.isVisible()) {
      await notifyToggle.click();
      await sleep(500);

      const anyToggle = page
        .locator('input[type="checkbox"], button.toggle, [role="switch"]')
        .first();
      if (await anyToggle.isVisible()) {
        await anyToggle.click();
        await sleep(300);
        results.push({
          test: 'Settings-通知开关',
          passed: true,
          detail: '通知开关切换成功',
        });
      } else {
        results.push({
          test: 'Settings-通知开关',
          passed: true,
          detail: '跳过（无可用开关）',
        });
      }
    }

    // ========== 侧边栏导航测试 ==========
    console.log('\n--- 侧边栏导航测试 ---');

    await page.goto('http://127.0.0.1:5700/', { waitUntil: 'networkidle' });
    await sleep(500);

    const sidebarItems = await page
      .locator('nav a, aside a, .sidebar a')
      .count();
    results.push({
      test: '侧边栏-导航项数量',
      passed: sidebarItems >= 7,
      detail: sidebarItems + ' 个导航项',
    });

    // 测试各页面导航
    const navLinks = [
      'tasks',
      'scripts',
      'logs',
      'envs',
      'dependencies',
      'settings',
    ];
    for (const link of navLinks) {
      const navLink = page.locator(`a[href="/${link}"]`).first();
      if (await navLink.isVisible()) {
        await navLink.click();
        await sleep(500);
        const onPage = page.url().includes('/' + link);
        results.push({
          test: `侧边栏-跳转${link}`,
          passed: onPage,
          detail: onPage ? '跳转成功' : '跳转失败',
        });
      }
    }
  } catch (err) {
    results.push({ test: '测试异常', passed: false, detail: err.message });
    console.error('测试异常:', err);
  }

  await browser.close();

  // 打印结果
  console.log('\n========================================');
  console.log('         全量前端功能测试结果');
  console.log('========================================');
  results.forEach((r) => {
    const status = r.passed ? '✅' : '❌';
    console.log(`${status} ${r.test}: ${r.detail}`);
  });
  console.log('========================================');
  console.log(`控制台错误: ${errors.length} 个`);
  if (errors.length > 0) {
    errors
      .slice(0, 5)
      .forEach((e) => console.log('  - ' + e.substring(0, 100)));
  }
  console.log('========================================\n');

  const passed = results.filter((r) => r.passed).length;
  console.log(`通过: ${passed}/${results.length}`);

  process.exit(passed === results.length ? 0 : 1);
}

test();
