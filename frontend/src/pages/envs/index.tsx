import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { envApi } from '@/services/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { SearchInput } from '@/components/ui/Input'
import { Plus, Trash2, Eye, EyeOff, Copy } from 'lucide-react'
import type { EnvItem } from '@/types'

export default function Envs() {
  const [search, setSearch] = useState('')
  const [visible, setVisible] = useState<Record<number, boolean>>({})
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['envs', search],
    queryFn: () => envApi.list({ searchValue: search }),
  })

  const envs: EnvItem[] = data?.data?.data ?? []

  const deleteMutation = useMutation({
    mutationFn: (ids: number[]) => envApi.delete(ids),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['envs'] }),
  })

  const toggleVisible = (id: number) => setVisible(prev => ({ ...prev, [id]: !prev[id] }))

  const copyValue = (value: string) => {
    navigator.clipboard.writeText(value)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <SearchInput
          placeholder="搜索变量名..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-64"
        />
        <div className="flex-1" />
        <Button size="sm">
          <Plus size={13} /> 新增变量
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>环境变量</CardTitle>
          <Badge variant="default">{envs.length} 个变量</Badge>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="text-center py-12 text-[var(--text-muted)] text-sm">加载中...</div>
          ) : envs.length === 0 ? (
            <div className="text-center py-12 text-[var(--text-muted)] text-sm">暂无环境变量</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  <th className="text-left px-5 py-3 text-xs text-[var(--text-muted)] font-medium">变量名</th>
                  <th className="text-left px-5 py-3 text-xs text-[var(--text-muted)] font-medium">值</th>
                  <th className="text-left px-5 py-3 text-xs text-[var(--text-muted)] font-medium">备注</th>
                  <th className="text-left px-5 py-3 text-xs text-[var(--text-muted)] font-medium">状态</th>
                  <th className="text-left px-5 py-3 text-xs text-[var(--text-muted)] font-medium">操作</th>
                </tr>
              </thead>
              <tbody>
                {envs.map((env) => (
                  <tr key={env.id} className="border-b border-[var(--border)] last:border-0 hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-3">
                      <code className="text-indigo-400 font-mono text-xs">{env.name}</code>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <code className="text-xs text-[var(--text-secondary)] font-mono truncate max-w-[240px]">
                          {visible[env.id] ? env.value : '••••••••••'}
                        </code>
                        <Button variant="ghost" size="icon" onClick={() => toggleVisible(env.id)}>
                          {visible[env.id] ? <EyeOff size={12} /> : <Eye size={12} />}
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => copyValue(env.value)} title="复制">
                          <Copy size={12} />
                        </Button>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-xs text-[var(--text-muted)]">{env.remarks || '—'}</td>
                    <td className="px-5 py-3">
                      <Badge variant={env.status === 1 ? 'success' : 'default'} dot>
                        {env.status === 1 ? '已启用' : '已禁用'}
                      </Badge>
                    </td>
                    <td className="px-5 py-3">
                      <Button variant="danger" size="icon" onClick={() => deleteMutation.mutate([env.id])}>
                        <Trash2 size={12} />
                      </Button>
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
