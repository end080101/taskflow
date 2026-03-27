import { Bell, User, LogOut, Search } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useNavigate, useLocation } from 'react-router-dom'
import { authApi } from '@/services/api'

const pageTitles: Record<string, string> = {
  '/': '仪表盘',
  '/tasks': '定时任务',
  '/scripts': '脚本管理',
  '/logs': '执行日志',
  '/envs': '环境变量',
  '/dependencies': '依赖包',
  '/subscriptions': '订阅管理',
  '/settings': '系统设置',
}

export function Header() {
  const navigate = useNavigate()
  const location = useLocation()
  const title = pageTitles[location.pathname] ?? 'TaskFlow'

  const handleLogout = async () => {
    try { await authApi.logout() } catch {}
    localStorage.removeItem('token')
    navigate('/login')
  }

  return (
    <header className="h-14 flex items-center justify-between px-6 border-b border-[var(--border)] bg-[var(--bg-secondary)]/50 backdrop-blur-sm flex-shrink-0">
      <h1 className="text-sm font-semibold text-[var(--text-primary)]">{title}</h1>

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" title="通知">
          <Bell size={15} />
        </Button>
        <Button variant="ghost" size="icon" title="退出登录" onClick={handleLogout}>
          <LogOut size={15} />
        </Button>
      </div>
    </header>
  )
}
