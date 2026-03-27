// 定时任务
export interface CronJob {
  id: number
  name: string
  command: string
  schedule: string
  status: 0 | 1  // 0=disabled, 1=enabled
  isRunning?: boolean
  last_execution_time?: string
  last_run_time?: string
  next_execution_time?: string
  log_path?: string
  pid?: number
  env_ids?: number[]
}

// 环境变量
export interface EnvItem {
  id: number
  name: string
  value: string
  remarks?: string
  status: 0 | 1
  position?: number
}

// 脚本文件
export interface ScriptFile {
  filename: string
  parent?: string
  isDir?: boolean
  size?: number
  modified?: string
}

// 日志
export interface LogEntry {
  id: number
  name: string
  status: 'running' | 'success' | 'failed' | 'queued'
  command: string
  pid?: number
  log_path?: string
  created_at?: string
  updated_at?: string
}

// 系统信息
export interface SystemInfo {
  version?: string
  branch?: string
  node_version?: string
  platform?: string
}

// 订阅
export interface Subscription {
  id: number
  name: string
  url: string
  type: 'public-repo' | 'private-repo' | 'file-url'
  schedule?: string
  status: 0 | 1
  last_run_time?: string
}

// 依赖包
export interface Dependence {
  id: number
  name: string
  type: 'nodejs' | 'python3' | 'linux'
  status?: number
  log?: string
  created?: string
  updated?: string
}

// API 通用响应
export interface ApiResponse<T = any> {
  code: number
  data: T
  message?: string
}

// 分页
export interface Pagination {
  page: number
  size: number
  total: number
}
