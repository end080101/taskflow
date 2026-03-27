import { cn } from '@/lib/utils'

interface BadgeProps {
  variant?: 'success' | 'error' | 'warning' | 'info' | 'default' | 'running'
  children: React.ReactNode
  className?: string
  dot?: boolean
}

const variants = {
  default: 'bg-white/5 text-[var(--text-secondary)] border-[var(--border)]',
  success: 'bg-green-500/10 text-green-400 border-green-500/20',
  error: 'bg-red-500/10 text-red-400 border-red-500/20',
  warning: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  info: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  running: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
}

const dotColors = {
  default: 'bg-[var(--text-muted)]',
  success: 'bg-green-400',
  error: 'bg-red-400',
  warning: 'bg-yellow-400',
  info: 'bg-blue-400',
  running: 'bg-indigo-400 animate-pulse',
}

export function Badge({ variant = 'default', children, className, dot }: BadgeProps) {
  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border',
      variants[variant],
      className
    )}>
      {dot && (
        <span className={cn('w-1.5 h-1.5 rounded-full', dotColors[variant])} />
      )}
      {children}
    </span>
  )
}
