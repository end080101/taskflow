const { chromium } = require('playwright');

const BASE_URL = process.env.TASKFLOW_BASE_URL || 'http://127.0.0.1:5710';
const API_BASE = `${BASE_URL}/api`;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  });

  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return { response, data: await response.json() };
  }

  return { response, data: await response.text() };
}

async function waitFor(checker, label, timeout = 180000, interval = 2000) {
  const start = Date.now();
  let lastError;

  while (Date.now() - start < timeout) {
    try {
      const result = await checker();
      if (result) {
        return result;
      }
    } catch (error) {
      lastError = error;
    }

    await sleep(interval);
  }

  if (lastError) {
    throw new Error(`${label} 超时: ${lastError.message}`);
  }
  throw new Error(`${label} 超时`);
}

function splitLogPath(logPath) {
  if (!logPath) {
    return { path: '', file: '' };
  }

  const parts = String(logPath).split('/');
  const file = parts.pop() || '';
  return { path: parts.join('/'), file };
}

async function getCronByName(name) {
  const result = await request(
    `/crons?searchValue=${encodeURIComponent(name)}`,
  );
  return result.data.data?.data?.find((item) => item.name === name);
}

async function getEnvByName(name) {
  const result = await request(`/envs?searchValue=${encodeURIComponent(name)}`);
  return result.data.data?.find((item) => item.name === name);
}

async function getDependencyByName(name) {
  const result = await request(
    `/dependencies?searchValue=${encodeURIComponent(name)}`,
  );
  return (result.data.data || [])
    .filter((item) => item.name === name)
    .sort((a, b) => b.id - a.id)[0];
}

async function getDependencyById(id) {
  const result = await request(`/dependencies/${id}`);
  return result.data.data;
}

async function waitForDependencyStatus(name, statuses) {
  return waitFor(async () => {
    const dep = await getDependencyByName(name);
    if (dep && statuses.includes(dep.status)) {
      return dep;
    }
    return null;
  }, `等待依赖 ${name} 状态 ${statuses.join(',')}`);
}

async function waitForDependencyIdStatus(id, statuses) {
  return waitFor(async () => {
    const dep = await getDependencyById(id);
    if (dep && statuses.includes(dep.status)) {
      return dep;
    }
    return null;
  }, `等待依赖 ${id} 状态 ${statuses.join(',')}`);
}

async function waitForCronLog(cronId, text) {
  return waitFor(
    async () => {
      const result = await request(`/crons/${cronId}/log`);
      const content = String(result.data.data || '');
      if (content.includes(text)) {
        return content;
      }
      return null;
    },
    `等待任务 ${cronId} 日志包含 ${text}`,
    120000,
    3000,
  );
}

async function waitForLogContaining(text, nameHint) {
  return waitFor(
    async () => {
      const result = await request('/logs');
      const folders = result.data.data || [];

      for (const folder of folders) {
        for (const file of folder.children || []) {
          const filename = file.title || file.key || '';
          const path = folder.title || folder.key || '';

          if (nameHint && !filename.includes(nameHint)) {
            continue;
          }

          const detail = await request(
            `/logs/detail?path=${encodeURIComponent(
              path,
            )}&file=${encodeURIComponent(filename)}`,
          );
          const content = String(detail.data.data || '');
          if (content.includes(text)) {
            return { path, file: filename, content };
          }
        }
      }

      return null;
    },
    `等待日志包含 ${text}`,
    120000,
    3000,
  );
}

async function clickButtonByTitle(row, title) {
  const button = row.locator(`button[title="${title}"]`).first();
  await button.click();
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  page.setDefaultTimeout(30000);

  const report = [];
  const consoleErrors = [];
  const dialogMessages = [];

  const created = {
    envIds: [],
    cronIds: [],
    depIds: [],
    scriptFiles: [],
    scriptFolders: [],
  };

  const addResult = (name, passed, detail) => {
    report.push({ name, passed, detail });
    console.log(`${passed ? 'PASS' : 'FAIL'} ${name} - ${detail}`);
  };

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      const text = msg.text();
      if (text.includes('Cross-Origin-Opener-Policy header has been ignored')) {
        return;
      }
      consoleErrors.push(text);
    }
  });

  page.on('dialog', async (dialog) => {
    dialogMessages.push(dialog.message());
    await dialog.accept();
  });

  const unique = Date.now();
  const folderName = `e2e_suite_${unique}`;
  const shellFile = 'suite-shell.sh';
  const pythonFile = 'suite-python.py';
  const nodeTempFile = 'suite-node-temp.js';
  const nodeFile = 'suite-node.js';
  const pythonRunnerFile = 'run-python.sh';
  const nodeRunnerFile = 'run-node.sh';

  let envName = `E2E_ENV_${unique}`;
  const envValueUpdated = `value_updated_${unique}`;
  let shellTaskName = `E2E Shell Task ${unique}`;
  const shellLabels = ['e2e', 'shell-chain'];
  const pythonPackage = 'ansi2html';
  const nodePackage = 'left-pad';
  const originalNotify = (await request('/user/notification')).data.data || {};
  const shellContent = `#!/usr/bin/env bash\necho "SHELL_CHAIN_OK ${envName}=${'$'}${envName}"\n`;
  const pythonContent = `#!/usr/bin/env python3\nimport json\nprint('PYTHON_TASK_OK', json.dumps({'suite': 'taskflow'}))\n`;
  const nodeContent = `#!/usr/bin/env node\nconst { execSync } = require('child_process');\nprocess.env.NODE_PATH = execSync('pnpm root -g').toString().trim();\nrequire('module').Module._initPaths();\nconst leftPad = require('left-pad');\nconsole.log('NODE_DEP_OK', leftPad('7', 3, '0'));\n`;
  const pythonRunnerContent = `#!/usr/bin/env bash\npython3 "$(dirname "$0")/${pythonFile}"\n`;
  const nodeRunnerContent = `#!/usr/bin/env bash\nnode "$(dirname "$0")/${nodeFile}"\n`;

  try {
    const systemResult = await request('/system');
    assert(
      systemResult.response.ok && systemResult.data.code === 200,
      '系统接口不可用',
    );
    addResult(
      '基础-系统接口可访问',
      true,
      `version=${systemResult.data.data.version}`,
    );

    const updateCheck = await request('/system/update-check', {
      method: 'PUT',
      body: JSON.stringify({}),
    });
    assert(
      updateCheck.response.ok && updateCheck.data.code === 200,
      '更新检查接口不可用',
    );
    addResult(
      '基础-更新检查可访问',
      true,
      `latest=${updateCheck.data.data.lastVersion}`,
    );

    await page.goto(`${BASE_URL}/envs`, { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: /新增变量/ }).click();
    await page.locator('input[placeholder="JD_COOKIE"]').fill(envName);
    await page
      .locator('input[placeholder="输入变量值"]')
      .fill(`value_initial_${unique}`);
    await page.locator('input[placeholder="可选备注"]').fill('created-by-ui');
    await page.getByRole('button', { name: /^创建$/ }).click();
    const createdEnv = await waitFor(
      () => getEnvByName(envName),
      `等待环境变量 ${envName}`,
    );
    created.envIds.push(createdEnv.id);
    addResult('环境变量-UI 创建', true, `id=${createdEnv.id}`);

    await page
      .locator(`tr:has-text("${envName}") button[title="编辑"]`)
      .click();
    await page.locator('input[placeholder="输入变量值"]').fill(envValueUpdated);
    await page.locator('input[placeholder="可选备注"]').fill('edited-by-ui');
    await page.getByRole('button', { name: /^保存$/ }).click();
    const updatedEnv = await waitFor(async () => {
      const env = await getEnvByName(envName);
      if (env && env.value === envValueUpdated) {
        return env;
      }
      return null;
    }, '等待环境变量更新');
    addResult('环境变量-UI 编辑', true, updatedEnv.value);

    const envRow = page.locator(`tr:has-text("${envName}")`).first();
    await envRow.locator('button').nth(0).click();
    await expectTextVisible(page, envValueUpdated, '环境变量明文显示');
    await clickButtonByTitle(envRow, '禁用');
    await waitFor(
      async () => (await getEnvByName(envName))?.status === 1,
      '等待环境变量禁用',
    );
    await clickButtonByTitle(envRow, '启用');
    await waitFor(
      async () => (await getEnvByName(envName))?.status === 0,
      '等待环境变量启用',
    );
    addResult('环境变量-显隐与启停', true, envName);

    await page.goto(`${BASE_URL}/scripts`, { waitUntil: 'networkidle' });
    await page.locator('button[title="新建文件夹"]').click();
    await page.locator('input[placeholder="文件夹名称"]').fill(folderName);
    await page.getByRole('button', { name: /^创建$/ }).click();
    created.scriptFolders.push(folderName);
    await page.locator(`text=${folderName}`).first().click();
    await page.locator('button[title="新建文件"]').click();
    await page.locator('input[placeholder="文件名称"]').fill(shellFile);
    await page.getByRole('button', { name: /^创建$/ }).click();
    created.scriptFiles.push(`${folderName}/${shellFile}`);
    await page.locator('button[title="新建文件"]').click();
    await page.locator('input[placeholder="文件名称"]').fill(pythonFile);
    await page.getByRole('button', { name: /^创建$/ }).click();
    created.scriptFiles.push(`${folderName}/${pythonFile}`);
    await page.locator('button[title="新建文件"]').click();
    await page.locator('input[placeholder="文件名称"]').fill(nodeTempFile);
    await page.getByRole('button', { name: /^创建$/ }).click();
    created.scriptFiles.push(`${folderName}/${nodeTempFile}`);
    addResult('脚本-UI 创建文件夹与文件', true, folderName);

    await page.locator(`div.group:has-text("${nodeTempFile}")`).hover();
    await page
      .locator(`div.group:has-text("${nodeTempFile}") button[title="重命名"]`)
      .click();
    await page.locator('input[placeholder="新名称"]').fill(nodeFile);
    await page.getByRole('button', { name: /^重命名$/ }).click();
    created.scriptFiles = created.scriptFiles.filter(
      (item) => item !== `${folderName}/${nodeTempFile}`,
    );
    created.scriptFiles.push(`${folderName}/${nodeFile}`);
    addResult('脚本-UI 重命名', true, `${nodeTempFile} -> ${nodeFile}`);

    await request('/scripts', {
      method: 'PUT',
      body: JSON.stringify({
        filename: shellFile,
        path: folderName,
        content: shellContent,
      }),
    });
    await request('/scripts', {
      method: 'PUT',
      body: JSON.stringify({
        filename: pythonFile,
        path: folderName,
        content: pythonContent,
      }),
    });
    await request('/scripts', {
      method: 'PUT',
      body: JSON.stringify({
        filename: nodeFile,
        path: folderName,
        content: nodeContent,
      }),
    });
    await request('/scripts', {
      method: 'POST',
      body: JSON.stringify({
        filename: pythonRunnerFile,
        path: folderName,
        content: pythonRunnerContent,
      }),
    });
    created.scriptFiles.push(`${folderName}/${pythonRunnerFile}`);
    await request('/scripts', {
      method: 'POST',
      body: JSON.stringify({
        filename: nodeRunnerFile,
        path: folderName,
        content: nodeRunnerContent,
      }),
    });
    created.scriptFiles.push(`${folderName}/${nodeRunnerFile}`);
    addResult('脚本-API 写入内容', true, folderName);

    await page.locator(`text=${shellFile}`).first().click();
    const downloadPromise = page.waitForEvent('download');
    await page.locator('button[title="下载"]').click();
    const download = await downloadPromise;
    assert(download.suggestedFilename() === shellFile, '脚本下载文件名不正确');
    addResult('脚本-UI 下载', true, download.suggestedFilename());

    await page.goto(`${BASE_URL}/dependencies`, { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: /添加依赖/ }).click();
    await page
      .locator('input[placeholder="依赖名称，如：axios"]')
      .fill(pythonPackage);
    await page.locator('select').nth(1).selectOption('1');
    await page.getByRole('button', { name: /^添加更多$/ }).click();
    await page
      .locator('input[placeholder="依赖名称，如：axios"]')
      .nth(1)
      .fill(nodePackage);
    await page.locator('select').nth(2).selectOption('0');
    await page.getByRole('button', { name: /^添加$/ }).click();

    const pythonDep = await waitForDependencyStatus(pythonPackage, [1]);
    const nodeDep = await waitForDependencyStatus(nodePackage, [1]);
    created.depIds.push(pythonDep.id, nodeDep.id);
    addResult(
      '依赖-安装 Python 包',
      true,
      `${pythonPackage} status=${pythonDep.status}`,
    );
    addResult(
      '依赖-安装 Node 包',
      true,
      `${nodePackage} status=${nodeDep.status}`,
    );

    const nodeDepDetail = await request(`/dependencies/${nodeDep.id}`);
    assert(nodeDepDetail.data.code === 200, '读取 Node 依赖详情失败');
    addResult('依赖-详情读取', true, `id=${nodeDep.id}`);

    await page.goto(`${BASE_URL}/tasks`, { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: /新建任务/ }).click();
    await page.locator('input[placeholder="输入任务名称"]').fill(shellTaskName);
    await page
      .locator('input[placeholder="task.sh"]')
      .fill(`${folderName}/${shellFile}`);
    await page.locator('input[placeholder="0 * * * *"]').fill('*/15 * * * * *');
    await page.getByRole('button', { name: /^创建$/ }).click();
    let shellTask = await waitFor(
      () => getCronByName(shellTaskName),
      '等待 shell 任务创建',
    );
    created.cronIds.push(shellTask.id);
    addResult('任务-UI 创建', true, `id=${shellTask.id}`);

    const createPythonTask = await request('/crons', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Python Inline Task',
        command:
          'python3 -c \'import json; print("PYTHON_TASK_OK", json.dumps({"suite": "taskflow"}))\'',
        schedule: '*/20 * * * * *',
      }),
    });
    assert(createPythonTask.data.code === 200, '创建 Python 内联任务失败');
    created.cronIds.push(createPythonTask.data.data.id);

    const createNodeTask = await request('/crons', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Node Inline Task',
        command:
          'node -e \'process.env.NODE_PATH=require("child_process").execSync("pnpm root -g").toString().trim();require("module").Module._initPaths();const leftPad=require("left-pad");console.log("NODE_DEP_OK", leftPad("7", 3, "0"));\'',
        schedule: '*/25 * * * * *',
      }),
    });
    assert(createNodeTask.data.code === 200, '创建 Node 内联任务失败');
    created.cronIds.push(createNodeTask.data.data.id);
    addResult(
      '任务-API 创建 Python/Node 内联任务',
      true,
      'python3 -c / node -e',
    );

    await page.fill('input[placeholder="搜索任务名称..."]', shellTaskName);
    const shellRow = page.locator(`tr:has-text("${shellTaskName}")`).first();
    await shellRow.locator('input[type="checkbox"]').click();
    await page.getByRole('button', { name: /标签/ }).click();
    await page
      .locator('input[placeholder="jd, tx, 京东"]')
      .fill(shellLabels.join(','));
    await page.getByRole('button', { name: /添加到 1 个任务/ }).click();
    await expectTextVisible(page, shellLabels[0], '任务标签显示');
    addResult('任务-批量标签', true, shellLabels.join(','));

    await clickButtonByTitle(shellRow, '编辑');
    shellTaskName = `${shellTaskName} Edited`;
    await page.locator('input[placeholder="输入任务名称"]').fill(shellTaskName);
    await page.getByRole('button', { name: /^保存$/ }).click();
    shellTask = await waitFor(
      () => getCronByName(shellTaskName),
      '等待任务编辑完成',
    );
    addResult('任务-UI 编辑', true, shellTaskName);

    const editedRow = page.locator(`tr:has-text("${shellTaskName}")`).first();
    await clickButtonByTitle(editedRow, '置顶');
    await waitFor(
      async () => (await getCronByName(shellTaskName))?.isPinned === 1,
      '等待任务置顶',
    );
    await clickButtonByTitle(editedRow, '禁用');
    await waitFor(
      async () => (await getCronByName(shellTaskName))?.isDisabled === 1,
      '等待任务禁用',
    );
    await clickButtonByTitle(editedRow, '启用');
    await waitFor(
      async () => (await getCronByName(shellTaskName))?.isDisabled === 0,
      '等待任务启用',
    );
    addResult('任务-置顶与启停', true, shellTaskName);

    await clickButtonByTitle(editedRow, '运行');
    const shellLog = await waitForCronLog(
      shellTask.id,
      `SHELL_CHAIN_OK ${envName}=${envValueUpdated}`,
    );
    addResult('任务-Shell 链路运行', true, '日志包含环境变量值');

    const pythonInlineTask = createPythonTask.data.data;
    const nodeInlineTask = createNodeTask.data.data;
    await request('/crons/run', {
      method: 'PUT',
      body: JSON.stringify([pythonInlineTask.id, nodeInlineTask.id]),
    });
    await waitForCronLog(pythonInlineTask.id, 'PYTHON_TASK_OK');
    addResult('任务-Python 内联执行链路', true, `id=${pythonInlineTask.id}`);
    await waitForCronLog(nodeInlineTask.id, 'NODE_DEP_OK 007');
    addResult('任务-Node 依赖执行链路', true, `id=${nodeInlineTask.id}`);

    const refreshedShellTask = await getCronByName(shellTaskName);
    const { path: logPath, file: logFile } = splitLogPath(
      refreshedShellTask.log_path,
    );
    assert(logFile, '未获取到 shell 任务日志路径');

    await page.goto(`${BASE_URL}/logs`, { waitUntil: 'networkidle' });
    await page.fill('input[placeholder="搜索日志..."]', logFile);
    const logRow = page.locator(`tr:has-text("${logFile}")`).first();
    await logRow.locator('td').first().click();
    await page.waitForSelector('[role="dialog"]');
    await page.waitForSelector('pre');
    const logText = await page.locator('pre').textContent();
    assert(
      (logText || '').includes(`SHELL_CHAIN_OK ${envName}=${envValueUpdated}`),
      '日志弹窗内容不正确',
    );
    addResult('日志-查看详情', true, logFile);

    await page.keyboard.press('Escape');
    await logRow.locator('button[title="删除"]').click();
    await waitFor(
      async () => {
        const result = await request('/logs');
        const folders = result.data.data || [];
        const exists = folders.some((folder) =>
          (folder.children || []).some(
            (file) =>
              (folder.title || folder.key || '') === logPath &&
              (file.title || file.key || '') === logFile,
          ),
        );
        return exists ? null : true;
      },
      '等待日志删除',
      30000,
      1000,
    );
    addResult('日志-删除', true, logFile);

    await page.goto(`${BASE_URL}/dependencies`, { waitUntil: 'networkidle' });
    await page.locator('select').first().selectOption('python3');
    await expectTextVisible(page, pythonPackage, '依赖页过滤显示 Python 包');
    await page.locator('select').first().selectOption('');
    addResult('依赖-页面过滤', true, pythonPackage);

    await page.goto(`${BASE_URL}/settings`, { waitUntil: 'networkidle' });
    await page.waitForSelector('text=系统信息');
    await page.locator('select').first().selectOption('');
    await page.getByRole('button', { name: /保存通知设置/ }).click();
    await waitFor(
      async () => {
        const notify = (await request('/user/notification')).data.data || {};
        return (notify.type || '') === '' ? true : null;
      },
      '等待通知设置保存',
      30000,
      1000,
    );
    addResult('设置-通知设置保存', true, 'type=空');

    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    await expectTextVisible(page, '仪表盘', '仪表盘标题显示');
    await expectTextVisible(page, '最近任务', '仪表盘概览显示');
    addResult('仪表盘-页面加载', true, '统计卡片可见');

    assert(
      consoleErrors.length === 0,
      `前端 console error: ${consoleErrors.join('; ')}`,
    );
    addResult('前端-控制台无报错', true, '0 error');
  } catch (error) {
    addResult('测试执行', false, error.message);
    throw error;
  } finally {
    if (originalNotify && Object.keys(originalNotify).length > 0) {
      await request('/user/notification', {
        method: 'PUT',
        body: JSON.stringify(originalNotify),
      }).catch(() => {});
    }

    for (const id of created.cronIds) {
      await request('/crons', {
        method: 'DELETE',
        body: JSON.stringify([id]),
      }).catch(() => {});
    }

    for (const id of created.envIds) {
      await request('/envs', {
        method: 'DELETE',
        body: JSON.stringify([id]),
      }).catch(() => {});
    }

    if (created.depIds.length) {
      await request('/dependencies/force', {
        method: 'DELETE',
        body: JSON.stringify(created.depIds),
      }).catch(() => {});
    }

    for (const filePath of created.scriptFiles) {
      const parts = filePath.split('/');
      const filename = parts.pop();
      const path = parts.join('/');
      await request('/scripts', {
        method: 'DELETE',
        body: JSON.stringify({ filename, path }),
      }).catch(() => {});
    }

    for (const folder of created.scriptFolders.reverse()) {
      await request('/scripts', {
        method: 'DELETE',
        body: JSON.stringify({ filename: folder, path: '' }),
      }).catch(() => {});
    }

    await browser.close();
    console.log('\n=== TEST REPORT ===');
    report.forEach((item) => {
      console.log(
        `${item.passed ? 'PASS' : 'FAIL'} ${item.name}: ${item.detail}`,
      );
    });
    console.log(
      `TOTAL: ${report.filter((item) => item.passed).length}/${report.length}`,
    );
    if (dialogMessages.length) {
      console.log(`DIALOGS: ${dialogMessages.join(' | ')}`);
    }
  }
}

async function expectTextVisible(page, text, label) {
  await page.waitForSelector(`text=${text}`);
  const visible = await page.locator(`text=${text}`).first().isVisible();
  assert(visible, `${label} 不可见`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
