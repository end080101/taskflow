import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useLocation } from 'react-router-dom';
import { getRouterBasename } from '@/lib/runtime';

const pageTitles: Record<string, string> = {
  '/': '仪表盘',
  '/tasks': '定时任务',
  '/scripts': '脚本管理',
  '/logs': '执行日志',
  '/envs': '环境变量',
  '/dependencies': '依赖管理',
  '/settings': '系统设置',
};

export function Header() {
  const location = useLocation();
  const routerBasename = getRouterBasename();
  const pathname =
    routerBasename !== '/' && location.pathname.startsWith(routerBasename)
      ? location.pathname.slice(routerBasename.length) || '/'
      : location.pathname;
  const title = pageTitles[pathname] ?? 'TaskFlow';

  return (
    <header className="hidden lg:flex h-14 items-center justify-between px-6 border-b border-[var(--border)] bg-[var(--bg-secondary)]/50 backdrop-blur-sm flex-shrink-0">
      <h1 className="text-sm font-semibold text-[var(--text-primary)]">
        {title}
      </h1>

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" title="通知">
          <Bell size={15} />
        </Button>
      </div>
    </header>
  );
}
