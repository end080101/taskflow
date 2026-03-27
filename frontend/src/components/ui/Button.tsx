import { cn } from '@/lib/utils'
import { type ButtonHTMLAttributes, forwardRef } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost' | 'danger' | 'success'
  size?: 'sm' | 'md' | 'lg' | 'icon'
}

const variants = {
  default: 'bg-indigo-600 hover:bg-indigo-500 text-white border border-indigo-500',
  outline: 'bg-transparent hover:bg-white/5 text-[var(--text-primary)] border border-[var(--border-hover)]',
  ghost: 'bg-transparent hover:bg-white/5 text-[var(--text-secondary)] border border-transparent',
  danger: 'bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-600/30',
  success: 'bg-green-600/20 hover:bg-green-600/30 text-green-400 border border-green-600/30',
}

const sizes = {
  sm: 'px-2.5 py-1 text-xs rounded-md',
  md: 'px-4 py-1.5 text-sm rounded-lg',
  lg: 'px-6 py-2 text-base rounded-lg',
  icon: 'w-8 h-8 p-0 flex items-center justify-center rounded-md',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'md', disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled}
        className={cn(
          'inline-flex items-center gap-1.5 font-medium transition-colors cursor-pointer',
          'disabled:opacity-40 disabled:cursor-not-allowed',
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'
