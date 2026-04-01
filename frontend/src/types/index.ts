// 定时任务
export interface CronJob {
  id: number;
  name: string;
  command: string;
  schedule: string;
  status: number;
  isDisabled?: 0 | 1;
  isPinned?: 0 | 1;
  labels?: string[];
  last_running_time?: number;
  last_execution_time?: number;
  log_path?: string;
  pid?: number;
  env_ids?: number[];
}

// 环境变量
export interface EnvItem {
  id: number;
  name: string;
  value: string;
  remarks?: string;
  status: number;
  position?: number;
  isPinned?: 0 | 1;
}

// 脚本文件
export interface ScriptFile {
  filename: string;
  parent?: string;
  isDir?: boolean;
  size?: number;
  modified?: string;
}

// 日志
export interface LogEntry {
  name: string;
  status: 'running' | 'archived';
  path?: string;
  file?: string;
  created_at?: string;
  size?: number;
}

// 系统信息
export interface SystemInfo {
  isInitialized?: boolean;
  version?: string;
  publishTime?: number;
  branch?: string;
  changeLog?: string;
  changeLogLink?: string;
}

// 依赖包
export interface Dependence {
  id: number;
  name: string;
  type: number;
  status?: number;
  log?: string[];
  remark?: string;
  created?: string;
  updated?: string;
}

// API 通用响应
export interface ApiResponse<T = unknown> {
  code: number;
  data: T;
  message?: string;
}

// 分页
export interface Pagination {
  page: number;
  size: number;
  total: number;
}
