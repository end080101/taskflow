<div align="center">
<h1 align="center">TaskFlow</h1>

A self-hosted task scheduler and script management platform for trusted environments, evolved from Qinglong with a new React panel and end-to-end tested workflows.

[简体中文](./README.md) | English

Timed task management platform supporting Python3, JavaScript, Shell and Typescript

[GitHub Issues](https://github.com/end080101/taskflow/issues) / [GitHub Repository](https://github.com/end080101/taskflow)
</div>

## Features

- Support for multiple scripting languages (python3, javaScript, shell, typescript)
- Support online management of scripts, environment variables, configuration files
- Support online view task log
- Support second-level task setting
- Support system level notification
- Support dark mode
- Support cell phone operation
- New React dashboard for internal no-login deployment
- Built-in Node.js / Python3 / Linux dependency management

## Current Positioning

- Designed for self-hosted and trusted internal environments
- No login page in the current release
- Backend keeps core Qinglong capabilities for cron jobs, scripts, envs, logs, dependencies and notifications
- Frontend is the new React panel aligned with the current main workflows

## Project Origin

- This project is evolved from Qinglong's core scheduling capabilities, with a focus on the new frontend, deployment compatibility and testing experience

## Runtime Requirements

- Docker deployment is recommended
- Local development requires `node`, `pnpm`, `python3` and `pip3`
- Linux package dependencies support `apk`, `apt-get`, `dnf`, `yum` and `pacman`

## Deployment

Two common ways are included in this repo:

### Docker deployment

Use `docker/docker-compose.deploy.yml`:

```bash
git clone <your-repo-url>
cd taskflow
docker compose -f docker/docker-compose.deploy.yml up -d --build
```

Default URL: <http://127.0.0.1:5700>

### Local development

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

Default URL: <http://127.0.0.1:5700>

Notes:

- This release is intended for trusted internal deployment without a login page
- `QlBaseUrl` is supported for sub-path deployment
- Linux package dependencies now support `apk`, `apt-get`, `dnf`, `yum` and `pacman`

## Testing

Two Playwright end-to-end suites are included:

```bash
TASKFLOW_BASE_URL="http://127.0.0.1:5700" node test_taskflow_full.js
TASKFLOW_BASE_URL="http://127.0.0.1:5700" node test_taskflow_edge.js
```

Coverage includes:

- Main workflows: tasks, scripts, envs, dependencies, logs, settings and dashboard
- Edge workflows: batch operations, complex labels, Linux dependencies, force delete, system reload and long-running log auto-refresh

## API and Commands

- The current source code and frontend behavior are the reference
- A dedicated `docs/` directory can be added later if needed

## Development

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

Open your browser and visit <http://127.0.0.1:5700>

## Known Limitations

- This release is intentionally no-login and should be protected by your internal network or upstream reverse proxy auth if exposed wider
- Historical login-based test scripts were removed; use the current E2E suites instead

## Acknowledgements

- Thanks to Qinglong for the mature scheduling foundation behind this project
