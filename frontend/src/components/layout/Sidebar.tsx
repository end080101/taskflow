import { NavLink } from 'react-router-dom'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Clock,
  FileCode2,
  ScrollText,
  KeyRound,
  Package,
  GitBranch,
  Settings,
  Zap,
} from 'lucide-react'

const navItems = [
  { to: '/', icon: LayoutDashboard, label: '仪表盘' },
  { to: '/tasks', icon: Clock, label: '定时任务' },
  { to: '/scripts', icon: FileCode2, label: '脚本管理' },
  { to: '/logs', icon: ScrollText, label: '执行日志' },
  { to: '/envs', icon: KeyRound, label: '环境变量' },
  { to: '/dependencies', icon: Package, label: '依赖包' },
  { to: '/subscriptions', icon: GitBranch, label: '订阅管理' },
]

const bottomItems = [
  { to: '/settings', icon: Settings, label: '系统设置' },
]

export function Sidebar() {
  return (
    <aside className="w-56 flex-shrink-0 flex flex-col bg-[var(--bg-secondary)] border-r border-[var(--border)] h-full">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-[var(--border)]">
        <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center">
          <Zap size={15} className="text-white" />
        </div>
        <span className="font-bold text-[var(--text-primary)] text-base tracking-tight">TaskFlow</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => (
          <NavItem key={item.to} {...item} />
        ))}
      </nav>

      {/* Bottom */}
      <div className="px-3 py-4 border-t border-[var(--border)] space-y-0.5">
        {bottomItems.map((item) => (
          <NavItem key={item.to} {...item} />
        ))}
      </div>
    </aside>
  )
}

function NavItem({ to, icon: Icon, label }: { to: string; icon: any; label: string }) {
  return (
    <NavLink
      to={to}
      end={to === '/'}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
          isActive
            ? 'bg-indigo-600/15 text-indigo-400 font-medium'
            : 'text-[var(--text-secondary)] hover:bg-white/5 hover:text-[var(--text-primary)]'
        )
      }
    >
      <Icon size={16} />
      {label}
    </NavLink>
  )
}
