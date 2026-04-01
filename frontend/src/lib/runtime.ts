declare global {
  interface Window {
    __ENV__QlBaseUrl?: string;
  }
}

function normalizeBasePath(value?: string) {
  if (!value || value === '/') {
    return '';
  }

  let normalized = value.trim();
  if (!normalized.startsWith('/')) {
    normalized = `/${normalized}`;
  }
  normalized = normalized.replace(/\/+$/, '');

  return normalized === '/' ? '' : normalized;
}

export function getAppBasePath() {
  return normalizeBasePath(window.__ENV__QlBaseUrl);
}

export function getRouterBasename() {
  return getAppBasePath() || '/';
}

export function getApiBasePath() {
  return `${getAppBasePath()}/api`;
}

export function loadRuntimeEnv() {
  return new Promise<void>((resolve) => {
    const script = document.createElement('script');
    script.src = './api/env.js';
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => resolve();
    document.head.appendChild(script);
  });
}
