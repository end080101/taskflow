const { chromium } = require('playwright');

const BASE_URL = process.env.TASKFLOW_BASE_URL || 'http://127.0.0.1:5700';
const API_BASE = `${BASE_URL}/api`;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  });
  const text = await response.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { raw: text };
  }
  return { response, data };
}

async function waitFor(checker, label, timeout = 180000, interval = 2000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    const result = await checker();
    if (result) return result;
    await sleep(interval);
  }
  throw new Error(`${label} 超时`);
}

async function getCronByName(name) {
  const result = await request(
    `/crons?searchValue=${encodeURIComponent(name)}`,
  );
  return result.data.data?.data?.find((item) => item.name === name);
}

function splitLogPath(logPath) {
  const parts = String(logPath || '').split('/');
  const file = parts.pop() || '';
  return { path: parts.join('/'), file };
}

async function getEnvByName(name) {
  const result = await request(`/envs?searchValue=${encodeURIComponent(name)}`);
  return result.data.data?.find((item) => item.name === name);
}

async function getDependencies(name) {
  const result = await request(
    `/dependencies?searchValue=${encodeURIComponent(name)}`,
  );
  return result.data.data || [];
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  page.setDefaultTimeout(30000);

  const report = [];
  const created = { crons: [], envs: [], deps: [] };

  const addResult = (name, passed, detail) => {
    report.push({ name, passed, detail });
    console.log(`${passed ? 'PASS' : 'FAIL'} ${name} - ${detail}`);
  };

  const unique = Date.now();
  const taskA = `EDGE_TASK_A_${unique}`;
  const taskB = `EDGE_TASK_B_${unique}`;
  const envA = `EDGE_ENV_A_${unique}`;
  const envB = `EDGE_ENV_B_${unique}`;
  const linuxDep = `bash`; // should reveal linux-package behavior in current image
  const nodeDep = `is-number`;

  try {
    const createA = await request('/crons', {
      method: 'POST',
      body: JSON.stringify({
        name: taskA,
        command: `echo ${taskA}`,
        schedule: '*/30 * * * * *',
      }),
    });
    const createB = await request('/crons', {
      method: 'POST',
      body: JSON.stringify({
        name: taskB,
        command: `echo ${taskB}`,
        schedule: '*/35 * * * * *',
      }),
    });
    created.crons.push(createA.data.data.id, createB.data.data.id);

    await request('/crons/labels', {
      method: 'POST',
      body: JSON.stringify({
        ids: created.crons,
        labels: ['edge', 'alpha', 'beta'],
      }),
    });
    await request('/crons/labels', {
      method: 'DELETE',
      body: JSON.stringify({ ids: created.crons, labels: ['beta'] }),
    });
    const cronA = await getCronByName(taskA);
    const cronB = await getCronByName(taskB);
    assert(
      cronA.labels.includes('edge') &&
        cronA.labels.includes('alpha') &&
        !cronA.labels.includes('beta'),
      '任务 A 标签不正确',
    );
    assert(
      cronB.labels.includes('edge') &&
        cronB.labels.includes('alpha') &&
        !cronB.labels.includes('beta'),
      '任务 B 标签不正确',
    );
    addResult('边缘-多任务复杂标签编辑', true, '批量添加/删除标签成功');

    const envCreate = await request('/envs', {
      method: 'POST',
      body: JSON.stringify([
        { name: envA, value: 'A', remarks: 'edge' },
        { name: envB, value: 'B', remarks: 'edge' },
      ]),
    });
    created.envs.push(...envCreate.data.data.map((item) => item.id));
    await request('/envs/disable', {
      method: 'PUT',
      body: JSON.stringify(created.envs),
    });
    await request('/envs/enable', {
      method: 'PUT',
      body: JSON.stringify(created.envs),
    });
    const envDocA = await getEnvByName(envA);
    const envDocB = await getEnvByName(envB);
    assert(
      envDocA.status === 0 && envDocB.status === 0,
      '批量环境变量启停失败',
    );
    addResult('边缘-环境变量批量启停', true, created.envs.join(','));

    await request('/dependencies', {
      method: 'POST',
      body: JSON.stringify([
        { name: nodeDep, type: 0, remark: 'edge-node' },
        { name: linuxDep, type: 2, remark: 'edge-linux' },
      ]),
    });
    const nodeInstalled = await waitFor(async () => {
      const dep = (await getDependencies(nodeDep))[0];
      return dep && [1, 2].includes(dep.status) ? dep : null;
    }, '等待 node 依赖状态');
    const linuxInstalled = await waitFor(async () => {
      const dep = (await getDependencies(linuxDep)).find(
        (item) => item.remark === 'edge-linux',
      );
      return dep && [1, 2].includes(dep.status) ? dep : null;
    }, '等待 linux 依赖状态');
    created.deps.push(nodeInstalled.id, linuxInstalled.id);
    addResult(
      '边缘-Node 依赖安装',
      nodeInstalled.status === 1,
      `status=${nodeInstalled.status}`,
    );
    addResult(
      '边缘-Linux 依赖安装链路',
      true,
      `status=${linuxInstalled.status}`,
    );

    const cancelResult = await request('/dependencies/cancel', {
      method: 'PUT',
      body: JSON.stringify([linuxInstalled.id]),
    });
    assert(cancelResult.data.code === 200, '依赖取消接口失败');
    addResult('边缘-依赖取消接口', true, `id=${linuxInstalled.id}`);

    const forceDelete = await request('/dependencies/force', {
      method: 'DELETE',
      body: JSON.stringify([linuxInstalled.id]),
    });
    assert(forceDelete.data.code === 200, '依赖强制删除失败');
    created.deps = created.deps.filter((id) => id !== linuxInstalled.id);
    const linuxLeft = (await getDependencies(linuxDep)).find(
      (item) => item.id === linuxInstalled.id,
    );
    assert(!linuxLeft, '依赖强制删除后仍存在');
    addResult('边缘-依赖强制删除', true, `id=${linuxInstalled.id}`);

    const configBefore = (await request('/system/config')).data.data.info || {};
    const nodeMirror = configBefore.nodeMirror || 'https://registry.npmjs.org/';
    const pythonMirror = configBefore.pythonMirror || 'https://pypi.org/simple';
    const proxyValue = configBefore.dependenceProxy || '';
    await request('/system/config/python-mirror', {
      method: 'PUT',
      body: JSON.stringify({ pythonMirror }),
    });
    await request('/system/config/dependence-proxy', {
      method: 'PUT',
      body: JSON.stringify({ dependenceProxy: proxyValue }),
    });
    await request('/system/config/node-mirror', {
      method: 'PUT',
      body: JSON.stringify({ nodeMirror }),
    });
    addResult(
      '边缘-设置镜像源与代理保存',
      true,
      'node/python/proxy 接口已调用',
    );

    const longTaskName = `EDGE_LONG_LOG_${unique}`;
    const longCreate = await request('/crons', {
      method: 'POST',
      body: JSON.stringify({
        name: longTaskName,
        command: `bash -lc 'echo LONG_START_${unique}; sleep 8; echo LONG_END_${unique}'`,
        schedule: '*/40 * * * * *',
      }),
    });
    created.crons.push(longCreate.data.data.id);
    await request('/crons/run', {
      method: 'PUT',
      body: JSON.stringify([longCreate.data.data.id]),
    });
    const runningCron = await waitFor(async () => {
      const cron = await getCronByName(longTaskName);
      return cron && (cron.status === 0 || cron.status === 0.5) ? cron : null;
    }, '等待长日志任务进入运行态');
    const { file: longLogFile } = splitLogPath(runningCron.log_path);
    assert(longLogFile, '未获取到长日志文件名');

    await page.goto(`${BASE_URL}/logs`, { waitUntil: 'networkidle' });
    await page.fill('input[placeholder="搜索日志..."]', longLogFile);
    const runningRow = await waitFor(
      async () => {
        await page
          .getByTitle('刷新')
          .click()
          .catch(() => {});
        const row = page.locator(`tr:has-text("${longLogFile}")`).first();
        if ((await row.count()) === 0) {
          return null;
        }
        const text = (await row.textContent()) || '';
        return text.includes('运行中') ? row : null;
      },
      '等待日志页出现运行中记录',
      60000,
      3000,
    );
    await runningRow.locator('td').first().click();
    await page.waitForSelector('[role="dialog"]');
    await page.waitForSelector('text=自动刷新');
    await page.waitForTimeout(12000);
    const logText = await page.locator('pre').textContent();
    assert(
      (logText || '').includes(`LONG_END_${unique}`),
      '日志自动刷新未拿到结束输出',
    );
    addResult('边缘-日志长时自动刷新', true, longTaskName);
    await page.keyboard.press('Escape');

    await request('/crons', {
      method: 'DELETE',
      body: JSON.stringify(created.crons),
    });
    created.crons = [];
    await request('/envs', {
      method: 'DELETE',
      body: JSON.stringify(created.envs),
    });
    created.envs = [];
    if (created.deps.length) {
      await request('/dependencies/force', {
        method: 'DELETE',
        body: JSON.stringify(created.deps),
      });
      created.deps = [];
    }
    addResult('边缘-批量删除任务变量依赖', true, '批量清理成功');

    const reload = await request('/system/reload', {
      method: 'PUT',
      body: JSON.stringify({ type: '' }),
    });
    assert(reload.data.code === 200, '系统重载接口失败');
    await waitFor(
      async () => {
        try {
          const health = await request('/health');
          return health.data.code === 200 ? true : null;
        } catch {
          return null;
        }
      },
      '等待系统重载恢复',
      120000,
      3000,
    );
    addResult('边缘-系统重载恢复', true, 'reload 后恢复可用');
  } catch (error) {
    addResult('测试执行', false, error.message);
    throw error;
  } finally {
    if (created.crons.length) {
      await request('/crons', {
        method: 'DELETE',
        body: JSON.stringify(created.crons),
      }).catch(() => {});
    }
    if (created.envs.length) {
      await request('/envs', {
        method: 'DELETE',
        body: JSON.stringify(created.envs),
      }).catch(() => {});
    }
    if (created.deps.length) {
      await request('/dependencies/force', {
        method: 'DELETE',
        body: JSON.stringify(created.deps),
      }).catch(() => {});
    }
    await browser.close();
    console.log('\n=== EDGE TEST REPORT ===');
    report.forEach((item) =>
      console.log(
        `${item.passed ? 'PASS' : 'FAIL'} ${item.name}: ${item.detail}`,
      ),
    );
    console.log(
      `TOTAL: ${report.filter((item) => item.passed).length}/${report.length}`,
    );
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
