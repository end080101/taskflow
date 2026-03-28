import http from '@/lib/http';
import type { CronJob, ApiResponse } from '@/types';

export const cronApi = {
  list: (params?: { searchValue?: string; page?: number; size?: number }) =>
    http.get<ApiResponse<{ data: CronJob[]; total: number }>>('/crons', {
      params,
    }),

  create: (data: Partial<CronJob>) =>
    http.post<ApiResponse<CronJob>>('/crons', data),

  update: (data: Partial<CronJob>) =>
    http.put<ApiResponse<CronJob>>('/crons', data),

  delete: (ids: number[]) => http.delete<ApiResponse>('/crons', { data: ids }),

  run: (ids: number[]) => http.put<ApiResponse>('/crons/run', ids),

  stop: (ids: number[]) => http.put<ApiResponse>('/crons/stop', ids),

  enable: (ids: number[]) => http.put<ApiResponse>('/crons/enable', ids),

  disable: (ids: number[]) => http.put<ApiResponse>('/crons/disable', ids),

  pin: (ids: number[]) => http.put<ApiResponse>('/crons/pin', ids),

  unpin: (ids: number[]) => http.put<ApiResponse>('/crons/unpin', ids),

  addLabels: (ids: number[], labels: string[]) =>
    http.post<ApiResponse>('/crons/labels', { ids, labels }),

  removeLabels: (ids: number[], labels: string[]) =>
    http.delete<ApiResponse>('/crons/labels', { data: { ids, labels } }),

  getLog: (id: number) => http.get<ApiResponse<string>>(`/crons/${id}/log`),
};

export const envApi = {
  list: (params?: { searchValue?: string }) =>
    http.get<ApiResponse<any[]>>('/envs', { params }),

  create: (data: any) => http.post<ApiResponse>('/envs', data),

  update: (data: any) => http.put<ApiResponse>('/envs', data),

  delete: (ids: number[]) => http.delete<ApiResponse>('/envs', { data: ids }),

  enable: (ids: number[]) => http.put<ApiResponse>('/envs/enable', ids),

  disable: (ids: number[]) => http.put<ApiResponse>('/envs/disable', ids),
};

export const scriptApi = {
  list: (params?: { path?: string }) =>
    http.get<ApiResponse<any[]>>('/scripts', { params }),

  getDetail: (path: string, file: string) =>
    http.get<ApiResponse<string>>('/scripts/detail', {
      params: { path, file },
    }),

  get: (filename: string, path?: string) =>
    http.get<ApiResponse<string>>(`/scripts/${filename}`, { params: { path } }),

  create: (data: { filename: string; path?: string; content?: string }) =>
    http.post<ApiResponse>('/scripts', data),

  save: (filename: string, content: string, path?: string) =>
    http.put<ApiResponse>('/scripts', { filename, content, path }),

  delete: (filename: string, path?: string) =>
    http.delete<ApiResponse>('/scripts', { data: { filename, path } }),

  run: (filename: string, content?: string, path?: string) =>
    http.put<ApiResponse>('/scripts/run', { filename, content, path }),

  stop: (filename: string, path?: string, pid?: number) =>
    http.put<ApiResponse>('/scripts/stop', { filename, path, pid }),

  rename: (filename: string, newFilename: string, path?: string) =>
    http.put<ApiResponse>('/scripts/rename', { filename, newFilename, path }),

  download: (filename: string, path?: string) =>
    http.post<ApiResponse>('/scripts/download', { filename, path }),
};

export const systemApi = {
  info: () => http.get<ApiResponse>('/system'),
  config: () => http.get<ApiResponse>('/system/config'),
  notify: (data: any) => http.put<ApiResponse>('/system/notify', data),
  updateNodeMirror: (nodeMirror: string) =>
    http.put<ApiResponse>('/system/config/node-mirror', { nodeMirror }),
  updatePythonMirror: (pythonMirror: string) =>
    http.put<ApiResponse>('/system/config/python-mirror', { pythonMirror }),
  updateLinuxMirror: (linuxMirror: string) =>
    http.put<ApiResponse>('/system/config/linux-mirror', { linuxMirror }),
  updateLogRemoveFrequency: (logRemoveFrequency: number | null) =>
    http.put<ApiResponse>('/system/config/log-remove-frequency', {
      logRemoveFrequency,
    }),
  updateCronConcurrency: (cronConcurrency: number | null) =>
    http.put<ApiResponse>('/system/config/cron-concurrency', {
      cronConcurrency,
    }),
  updateDependenceProxy: (dependenceProxy: string) =>
    http.put<ApiResponse>('/system/config/dependence-proxy', {
      dependenceProxy,
    }),
  checkUpdate: () => http.put<ApiResponse>('/system/update-check'),
  reload: (type?: string) => http.put<ApiResponse>('/system/reload', { type }),
};

export const notificationApi = {
  get: () => http.get<ApiResponse<any>>('/user/notification'),
  update: (data: any) => http.put<ApiResponse>('/user/notification', data),
};

export const authApi = {
  login: (username: string, password: string) =>
    http.post<ApiResponse<{ token: string }>>('/user/login', {
      username,
      password,
    }),

  logout: () => http.post<ApiResponse>('/user/logout'),

  changePassword: (data: any) => http.put<ApiResponse>('/user', data),
};

export const logApi = {
  list: (params?: any) => http.get<ApiResponse<any[]>>('/logs', { params }),
  getDetail: (path: string, file: string) =>
    http.get<ApiResponse<string>>('/logs/detail', { params: { path, file } }),
  delete: (names: string[]) =>
    http.delete<ApiResponse>('/logs', { data: names }),
};

export const dependenceApi = {
  list: (params?: { searchValue?: string; type?: string; status?: string }) =>
    http.get<ApiResponse<any[]>>('/dependencies', { params }),
  create: (data: { name: string; type: number; remark?: string }[]) =>
    http.post<ApiResponse>('/dependencies', data),
  update: (data: { id: number; name: string; type: number; remark?: string }) =>
    http.put<ApiResponse>('/dependencies', data),
  delete: (ids: number[]) =>
    http.delete<ApiResponse>('/dependencies', { data: ids }),
  reinstall: (ids: number[]) =>
    http.put<ApiResponse>('/dependencies/reinstall', ids),
  cancel: (ids: number[]) => http.put<ApiResponse>('/dependencies/cancel', ids),
};

export const subscriptionApi = {
  list: () => http.get<ApiResponse<any[]>>('/subscriptions'),
  create: (data: any) => http.post<ApiResponse>('/subscriptions', data),
  update: (data: any) => http.put<ApiResponse>('/subscriptions', data),
  delete: (ids: number[]) =>
    http.delete<ApiResponse>('/subscriptions', { data: ids }),
  run: (id: number) => http.put<ApiResponse>(`/subscriptions/${id}/run`),
};
