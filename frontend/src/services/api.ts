import http from '@/lib/http'
import type { CronJob, ApiResponse } from '@/types'

export const cronApi = {
  list: (params?: { searchValue?: string; page?: number; size?: number }) =>
    http.get<ApiResponse<{ data: CronJob[]; total: number }>>('/crons', { params }),

  create: (data: Partial<CronJob>) =>
    http.post<ApiResponse<CronJob>>('/crons', data),

  update: (data: Partial<CronJob>) =>
    http.put<ApiResponse<CronJob>>('/crons', data),

  delete: (ids: number[]) =>
    http.delete<ApiResponse>('/crons', { data: ids }),

  run: (ids: number[]) =>
    http.put<ApiResponse>('/crons/run', ids),

  stop: (ids: number[]) =>
    http.put<ApiResponse>('/crons/stop', ids),

  enable: (ids: number[]) =>
    http.put<ApiResponse>('/crons/enable', ids),

  disable: (ids: number[]) =>
    http.put<ApiResponse>('/crons/disable', ids),

  getLog: (id: number) =>
    http.get<ApiResponse<string>>(`/crons/${id}/log`),
}

export const envApi = {
  list: (params?: { searchValue?: string }) =>
    http.get<ApiResponse<any[]>>('/envs', { params }),

  create: (data: any) =>
    http.post<ApiResponse>('/envs', data),

  update: (data: any) =>
    http.put<ApiResponse>('/envs', data),

  delete: (ids: number[]) =>
    http.delete<ApiResponse>('/envs', { data: ids }),

  enable: (ids: number[]) =>
    http.put<ApiResponse>('/envs/enable', ids),

  disable: (ids: number[]) =>
    http.put<ApiResponse>('/envs/disable', ids),
}

export const scriptApi = {
  list: (params?: { path?: string }) =>
    http.get<ApiResponse<any[]>>('/scripts', { params }),

  get: (filename: string, path?: string) =>
    http.get<ApiResponse<string>>(`/scripts/${filename}`, { params: { path } }),

  save: (filename: string, content: string, path?: string) =>
    http.put<ApiResponse>(`/scripts/${filename}`, { content, path }),

  delete: (filename: string, path?: string) =>
    http.delete<ApiResponse>(`/scripts/${filename}`, { data: { path } }),
}

export const systemApi = {
  info: () => http.get<ApiResponse>('/system'),
  notify: (data: any) => http.put<ApiResponse>('/system/notify', data),
}

export const authApi = {
  login: (username: string, password: string) =>
    http.post<ApiResponse<{ token: string }>>('/user/login', { username, password }),

  logout: () => http.post<ApiResponse>('/user/logout'),

  changePassword: (data: any) => http.put<ApiResponse>('/user', data),
}

export const logApi = {
  list: (params?: any) =>
    http.get<ApiResponse<any[]>>('/logs', { params }),
}

export const subscriptionApi = {
  list: () => http.get<ApiResponse<any[]>>('/subscriptions'),
  create: (data: any) => http.post<ApiResponse>('/subscriptions', data),
  update: (data: any) => http.put<ApiResponse>('/subscriptions', data),
  delete: (ids: number[]) => http.delete<ApiResponse>('/subscriptions', { data: ids }),
  run: (id: number) => http.put<ApiResponse>(`/subscriptions/${id}/run`),
}
