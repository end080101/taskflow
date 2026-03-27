import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { cronApi } from '@/services/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { SearchInput } from '@/components/ui/Input'
import { Play, Square, Plus, Trash2, ToggleLeft, ToggleRight } from 'lucide-react'
import { formatDate, parseCron } from '@/lib/utils'
import type { CronJob } from '@/types'

export default function Tasks() {
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<number[]>([])
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['crons', search],
    queryFn: () => cronApi.list({ searchValue: search }),
  })

  const crons: CronJob[] = data?.data?.data?.data ?? []

  const runMutation = useMutation({
    mutationFn: (ids: number[]) => cronApi.run(ids),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['crons'] }),
  })

  const stopMutation = useMutation({
    mutationFn: (ids: number[]) => cronApi.stop(ids),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['crons'] }),
  })

  const deleteMutation = useMutation({
    mutationFn: (ids: number[]) => cronApi.delete(ids),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['crons'] }); setSelected([]) },
  })

  const toggleSelect = (id: number) => {
    setSelected(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <SearchInput
          placeholder="搜索任务名称..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-64"
        />
        <div className="flex-1" />
        {selected.length > 0 && (
          <>
            <span className="text-xs text-[var(--text-muted)]">已选 {selected.length}</span>
            <Button variant="success" size="sm" onClick={() => runMutation.mutate(selected)}>
              <Play size={13} /> 运行
            </Button>
            <Button variant="outline" size="sm" onClick={() => stopMutation.mutate(selected)}>
              <Square size={13} /> 停止
            </Button>
            <Button variant="danger" size="sm" onClick={() => deleteMutation.mutate(selected)}>
              <Trash2 size={13} /> 删除
            </Button>
          </>
        )}
        <Button size="sm">
          <Plus size={13} /> 新建任务
        </Button>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>定时任务列表</CardTitle>
          <Badge variant="default">{crons.length} 个任务</Badge>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="text-center py-12 text-[var(--text-muted)] text-sm">加载中...</div>
          ) : crons.length === 0 ? (
            <div className="text-center py-12 text-[var(--text-muted)] text-sm">暂无定时任务</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  <th className="px-5 py-3 w-8">
                    <input
                      type="checkbox"
                      className="accent-indigo-500"
                      checked={selected.length === crons.length && crons.length > 0}
                      onChange={e => setSelected(e.target.checked ? crons.map(c => c.id) : [])}
                    />
                  </th>
                  <th className="text-left px-5 py-3 text-xs text-[var(--text-muted)] font-medium">任务名称</th>
                  <th className="text-left px-5 py-3 text-xs text-[var(--text-muted)] font-medium">命令</th>
                  <th className="text-left px-5 py-3 text-xs text-[var(--text-muted)] font-medium">调度</th>
                  <th className="text-left px-5 py-3 text-xs text-[var(--text-muted)] font-medium">上次运行</th>
                  <th className="text-left px-5 py-3 text-xs text-[var(--text-muted)] font-medium">状态</th>
                  <th className="text-left px-5 py-3 text-xs text-[var(--text-muted)] font-medium">操作</th>
                </tr>
              </thead>
              <tbody>
                {crons.map((cron) => (
                  <tr key={cron.id} className="border-b border-[var(--border)] last:border-0 hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-3">
                      <input
                        type="checkbox"
                        className="accent-indigo-500"
                        checked={selected.includes(cron.id)}
                        onChange={() => toggleSelect(cron.id)}
                      />
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        {cron.isRunning && (
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse flex-shrink-0" />
                        )}
                        <span className="font-medium text-[var(--text-primary)] truncate max-w-[160px]">{cron.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <code className="text-xs text-[var(--text-muted)] font-mono truncate max-w-[200px] block">{cron.command}</code>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex flex-col">
                        <code className="text-xs text-indigo-400 font-mono">{cron.schedule}</code>
                        <span className="text-xs text-[var(--text-muted)]">{parseCron(cron.schedule)}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-xs text-[var(--text-muted)]">
                      {cron.last_run_time ? formatDate(cron.last_run_time) : '从未运行'}
                    </td>
                    <td className="px-5 py-3">
                      {cron.isRunning ? (
                        <Badge variant="running" dot>运行中</Badge>
                      ) : (
                        <Badge variant={cron.status === 1 ? 'success' : 'default'} dot>
                          {cron.status === 1 ? '已启用' : '已禁用'}
                        </Badge>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-1">
                        {cron.isRunning ? (
                          <Button variant="outline" size="icon" title="停止" onClick={() => stopMutation.mutate([cron.id])}>
                            <Square size={12} />
                          </Button>
                        ) : (
                          <Button variant="ghost" size="icon" title="运行" onClick={() => runMutation.mutate([cron.id])}>
                            <Play size={12} />
                          </Button>
                        )}
                        <Button variant="danger" size="icon" title="删除" onClick={() => deleteMutation.mutate([cron.id])}>
                          <Trash2 size={12} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
