import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date) {
  return new Date(date).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

export function formatDuration(ms: number) {
  if (ms < 1000) return `${ms}ms`
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
  const m = Math.floor(ms / 60000)
  const s = Math.floor((ms % 60000) / 1000)
  return `${m}m ${s}s`
}

export function parseCron(expr: string): string {
  const parts = expr.trim().split(/\s+/)
  if (parts.length < 5) return expr
  const [min, hour, dom, month, dow] = parts
  if (min === '0' && hour === '0' && dom === '*' && month === '*' && dow === '*') return '每天 00:00'
  if (min === '0' && dom === '*' && month === '*' && dow === '*') return `每天 ${hour}:00`
  if (dom === '*' && month === '*' && dow === '*') return `每天 ${hour}:${min.padStart(2, '0')}`
  return expr
}
