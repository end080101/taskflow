<div align="center">
<img width="100" src="https://user-images.githubusercontent.com/22700758/191449379-f9f56204-0e31-4a16-be5a-331f52696a73.png">

<h1 align="center">TaskFlow</h1>

一个面向内网与自托管场景的任务调度与脚本管理平台，基于 Qinglong 核心能力演进，提供新版 React 面板与更完整的端到端测试。

简体中文 | [English](./README-en.md)

支持 Python3、JavaScript、Shell、Typescript 的定时任务管理平台

[问题反馈](https://github.com/end080101/taskflow/issues) / [项目仓库](https://github.com/end080101/taskflow)
</div>

![cover](https://user-images.githubusercontent.com/22700758/244847235-8dc1ca21-e03f-4606-9458-0541fab60413.png)

## 功能

- 支持多种脚本语言（python3、javaScript、shell、typescript）
- 支持在线管理脚本、环境变量、配置文件
- 支持在线查看任务日志
- 支持秒级任务设置
- 支持系统级通知
- 支持暗黑模式
- 支持手机端操作
- 新版 React 面板，支持无登录内网部署
- 支持 Node.js / Python3 / Linux 依赖管理

## 当前定位

- 默认面向内网/可信环境部署，不提供登录页
- 后端保留青龙核心任务、脚本、环境变量、日志、依赖、通知能力
- 前端为新版 React 面板，已对齐当前主要业务链路

## 项目来源

- 本项目基于 Qinglong 的核心能力演进而来
- 目标不是抹去原项目来源，而是在保留成熟调度能力的基础上，提供更现代的前端与更完整的部署、测试体验

## 运行环境

- 推荐使用 Docker 部署
- 本地开发需要自行准备 `node`、`pnpm`、`python3`、`pip3`
- Linux 依赖安装已兼容 `apk` / `apt-get` / `dnf` / `yum` / `pacman`

## 部署

当前仓库包含两种常用方式：

### Docker 部署

开发后的 Debian 部署文件：`docker/docker-compose.deploy.yml`

```bash
git clone <your-repo-url>
cd taskflow
docker compose -f docker/docker-compose.deploy.yml up -d --build
```

默认访问地址：<http://127.0.0.1:5700>

### 本机开发

```bash
git clone <your-repo-url>
cd taskflow
cp .env.example .env
pnpm install
pnpm --dir frontend install
pnpm --dir frontend build
pnpm build:back
node static/build/app.js
```

默认访问地址：<http://127.0.0.1:5700>

说明：

- 当前版本默认面向内网/可信环境，无登录页
- `QlBaseUrl` 可用于子路径部署
- Linux 依赖安装已兼容 `apk` / `apt-get` / `dnf` / `yum` / `pacman`

## API 与命令

- 当前以仓库源码与前端页面行为为准
- 如果后续需要，我可以继续帮你补一份独立的 `docs/` 文档

## 测试

仓库内提供两套 Playwright 端到端脚本：

```bash
TASKFLOW_BASE_URL="http://127.0.0.1:5700" node test_taskflow_full.js
TASKFLOW_BASE_URL="http://127.0.0.1:5700" node test_taskflow_edge.js
```

覆盖内容包括：

- 主业务链路：任务、脚本、环境变量、依赖、日志、设置、仪表盘
- 边缘链路：批量操作、复杂标签、Linux 依赖、强制删除、系统重载、长日志自动刷新

## 已知限制

- 当前默认是无登录部署，适合内网、自托管或反向代理后受控访问场景
- 如果需要公网暴露，建议自行在上层反代或网关增加认证
- 旧版与登录相关的历史测试脚本已移除，以当前 E2E 脚本为准

## 开发

```bash
git clone https://github.com/end080101/taskflow.git
cd taskflow
cp .env.example .env
pnpm install
pnpm --dir frontend install
pnpm --dir frontend build
pnpm build:back
node static/build/app.js
```

打开你的浏览器，访问 <http://127.0.0.1:5700>

## 致谢

- 本项目能力基础来自 Qinglong
- 新版前端、部署适配与测试体系为本仓库当前维护重点
