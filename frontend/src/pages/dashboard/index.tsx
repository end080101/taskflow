import { useQuery } from '@tanstack/react-query';
import { cronApi, envApi, logApi } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Clock, KeyRound, Activity, Zap } from 'lucide-react';
import {
  formatDate,
  getCronLastRunTime,
  isCronEnabled,
  isCronRunning,
  isEnvEnabled,
} from '@/lib/utils';
import type { CronJob, EnvItem } from '@/types';

interface LogTreeFile {
  createTime?: number;
  modifiedTime?: number;
}

interface LogTreeFolder {
  children?: LogTreeFile[];
}

export default function Dashboard() {
  const { data: cronsData } = useQuery({
    queryKey: ['crons'],
    queryFn: () => cronApi.list({ size: 100 }),
  });
  const { data: envsData } = useQuery({
    queryKey: ['envs'],
    queryFn: () => envApi.list(),
  });
  const { data: logsData } = useQuery({
    queryKey: ['logs-dashboard'],
    queryFn: () => logApi.list(),
  });

  const crons: CronJob[] = cronsData?.data?.data?.data ?? [];
  const envs = (envsData?.data?.data ?? []) as EnvItem[];
  const logFolders = (logsData?.data?.data ?? []) as LogTreeFolder[];

  const runningCrons = crons.filter((c) => isCronRunning(c));
  const enabledCrons = crons.filter((c) => isCronEnabled(c));
  const enabledEnvs = envs.filter((e) => isEnvEnabled(e));
  const today = new Date().toISOString().slice(0, 10);
  const todayLogs = logFolders
    .flatMap((folder) => folder.children || [])
    .filter((file) => {
      const rawTime = file.createTime || file.modifiedTime;
      if (!rawTime) return false;
      return new Date(rawTime).toISOString().slice(0, 10) === today;
    });

  const stats = [
    {
      label: '定时任务',
      value: crons.length,
      sub: `${enabledCrons.length} 已启用`,
      icon: Clock,
      color: 'text-indigo-400',
      bg: 'bg-indigo-500/10',
    },
    {
      label: '运行中',
      value: runningCrons.length,
      sub: '实时执行',
      icon: Activity,
      color: 'text-green-400',
      bg: 'bg-green-500/10',
    },
    {
      label: '环境变量',
      value: envs.length,
      sub: `${enabledEnvs.length} 已启用`,
      icon: KeyRound,
      color: 'text-yellow-400',
      bg: 'bg-yellow-500/10',
    },
    {
      label: '今日执行',
      value: todayLogs.length,
      sub: '日志新增',
      icon: Zap,
      color: 'text-blue-400',
      bg: 'bg-blue-500/10',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="flex items-center gap-4">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.bg}`}
              >
                <s.icon size={18} className={s.color} />
              </div>
              <div>
                <div className="text-2xl font-bold text-[var(--text-primary)]">
                  {s.value}
                </div>
                <div className="text-xs text-[var(--text-muted)]">
                  {s.label} · {s.sub}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Running tasks */}
      <Card>
        <CardHeader>
          <CardTitle>正在运行的任务</CardTitle>
          {runningCrons.length > 0 && (
            <Badge variant="running" dot>
              {runningCrons.length} 运行中
            </Badge>
          )}
        </CardHeader>
        <CardContent>
          {runningCrons.length === 0 ? (
            <div className="text-center py-8 text-[var(--text-muted)] text-sm">
              暂无运行中的任务
            </div>
          ) : (
            <div className="space-y-2">
              {runningCrons.map((cron) => (
                <div
                  key={cron.id}
                  className="flex items-center justify-between py-2 px-3 rounded-lg bg-[var(--bg-hover)]"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
                    <span className="text-sm text-[var(--text-primary)]">
                      {cron.name}
                    </span>
                    <code className="text-xs text-[var(--text-muted)] font-mono">
                      {cron.schedule}
                    </code>
                  </div>
                  <Badge variant="running" dot>
                    运行中
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent tasks */}
      <Card>
        <CardHeader>
          <CardTitle>最近任务</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {crons.slice(0, 8).length === 0 ? (
            <div className="text-center py-8 text-[var(--text-muted)] text-sm">
              暂无任务数据
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  <th className="text-left px-5 py-3 text-xs text-[var(--text-muted)] font-medium">
                    任务名称
                  </th>
                  <th className="text-left px-5 py-3 text-xs text-[var(--text-muted)] font-medium">
                    调度
                  </th>
                  <th className="text-left px-5 py-3 text-xs text-[var(--text-muted)] font-medium">
                    上次运行
                  </th>
                  <th className="text-left px-5 py-3 text-xs text-[var(--text-muted)] font-medium">
                    状态
                  </th>
                </tr>
              </thead>
              <tbody>
                {crons.slice(0, 8).map((cron) => (
                  <tr
                    key={cron.id}
                    className="border-b border-[var(--border)] last:border-0 hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="px-5 py-3 text-[var(--text-primary)] font-medium">
                      {cron.name}
                    </td>
                    <td className="px-5 py-3">
                      <code className="text-xs text-[var(--text-muted)] font-mono">
                        {cron.schedule}
                      </code>
                    </td>
                    <td className="px-5 py-3 text-xs text-[var(--text-muted)]">
                      {getCronLastRunTime(cron)
                        ? formatDate(getCronLastRunTime(cron) as number)
                        : '—'}
                    </td>
                    <td className="px-5 py-3">
                      <Badge
                        variant={isCronEnabled(cron) ? 'success' : 'default'}
                        dot
                      >
                        {isCronEnabled(cron) ? '已启用' : '已禁用'}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
