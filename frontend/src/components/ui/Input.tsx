import { cn } from '@/lib/utils'
import { type InputHTMLAttributes, forwardRef } from 'react'
import { Search } from 'lucide-react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, icon, ...props }, ref) => (
    <div className="relative">
      {icon && (
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">
          {icon}
        </span>
      )}
      <input
        ref={ref}
        className={cn(
          'w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg',
          'text-[var(--text-primary)] placeholder:text-[var(--text-muted)]',
          'text-sm px-3 py-2',
          'focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20',
          'transition-colors',
          icon && 'pl-9',
          className
        )}
        {...props}
      />
    </div>
  )
)
Input.displayName = 'Input'

export function SearchInput(props: Omit<InputProps, 'icon'>) {
  return <Input icon={<Search size={14} />} {...props} />
}
