import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dependenceApi } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input, SearchInput } from '@/components/ui/Input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/Dialog';
import { Plus, Trash2, RefreshCw, XCircle, Play } from 'lucide-react';
import type { Dependence } from '@/types';

const DEP_TYPES: { value: number | string; label: string }[] = [
  { value: 'nodejs', label: 'Node.js' },
  { value: 'python3', label: 'Python3' },
  { value: 'linux', label: 'Linux' },
];

const DEP_CREATE_TYPES: { value: number; label: string }[] = [
  { value: 0, label: 'Node.js' },
  { value: 1, label: 'Python3' },
  { value: 2, label: 'Linux' },
];

const DEP_TYPE_LABELS: Record<number, string> = {
  0: 'Node.js',
  1: 'Python3',
  2: 'Linux',
};

const STATUS_MAP: Record<
  number,
  {
    label: string;
    variant: 'default' | 'success' | 'running' | 'error' | 'warning';
  }
> = {
  0: { label: '安装中', variant: 'running' },
  1: { label: '已安装', variant: 'success' },
  2: { label: '安装失败', variant: 'error' },
  3: { label: '卸载中', variant: 'running' },
  4: { label: '已删除', variant: 'default' },
  5: { label: '删除失败', variant: 'error' },
  6: { label: '队列中', variant: 'default' },
  7: { label: '已取消', variant: 'warning' },
};

export default function Dependencies() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [selected, setSelected] = useState<number[]>([]);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newDeps, setNewDeps] = useState<
    { name: string; type: number; remark: string }[]
  >([{ name: '', type: 0, remark: '' }]);

  const { data, isLoading } = useQuery({
    queryKey: ['dependencies', search, typeFilter],
    queryFn: () =>
      dependenceApi.list({ searchValue: search, type: typeFilter }),
  });

  const deps = (data?.data?.data ?? []) as Dependence[];

  const createMutation = useMutation({
    mutationFn: (data: { name: string; type: number; remark?: string }[]) =>
      dependenceApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['dependencies'] });
      setCreateDialogOpen(false);
      setNewDeps([{ name: '', type: 0, remark: '' }]);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (ids: number[]) => dependenceApi.delete(ids),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['dependencies'] });
      setSelected([]);
    },
  });

  const reinstallMutation = useMutation({
    mutationFn: (ids: number[]) => dependenceApi.reinstall(ids),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['dependencies'] });
      setSelected([]);
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (ids: number[]) => dependenceApi.cancel(ids),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['dependencies'] });
      setSelected([]);
    },
  });

  const toggleSelect = (id: number) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const handleAddDep = () => {
    setNewDeps((prev) => [...prev, { name: '', type: 0, remark: '' }]);
  };

  const handleRemoveDep = (index: number) => {
    setNewDeps((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDepChange = (
    index: number,
    field: string,
    value: string | number,
  ) => {
    setNewDeps((prev) =>
      prev.map((dep, i) => (i === index ? { ...dep, [field]: value } : dep)),
    );
  };

  const handleCreate = () => {
    const validDeps = newDeps.filter((d) => d.name.trim());
    if (validDeps.length === 0) return;
    createMutation.mutate(validDeps);
  };

  const getStatusInfo = (status?: number) => {
    return STATUS_MAP[status || 0] || STATUS_MAP[0];
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <SearchInput
          placeholder="搜索依赖..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-64"
        />
        <select
          className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)]"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
        >
          <option value="">全部类型</option>
          {DEP_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
        <div className="flex-1" />
        {selected.length > 0 && (
          <>
            <span className="text-xs text-[var(--text-muted)]">
              已选 {selected.length}
            </span>
            <Button
              variant="success"
              size="sm"
              onClick={() => reinstallMutation.mutate(selected)}
            >
              <Play size={13} /> 重新安装
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => cancelMutation.mutate(selected)}
            >
              <XCircle size={13} /> 取消
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => deleteMutation.mutate(selected)}
            >
              <Trash2 size={13} /> 删除
            </Button>
          </>
        )}
        <Button size="sm" onClick={() => setCreateDialogOpen(true)}>
          <Plus size={13} /> 添加依赖
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>依赖管理</CardTitle>
          <Badge variant="default">{deps.length} 个依赖</Badge>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="text-center py-12 text-[var(--text-muted)] text-sm">
              加载中...
            </div>
          ) : deps.length === 0 ? (
            <div className="text-center py-12 text-[var(--text-muted)] text-sm">
              暂无依赖
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  <th className="px-5 py-3 w-8">
                    <input
                      type="checkbox"
                      className="accent-indigo-500"
                      checked={
                        selected.length === deps.length && deps.length > 0
                      }
                      onChange={(e) =>
                        setSelected(
                          e.target.checked ? deps.map((d) => d.id) : [],
                        )
                      }
                    />
                  </th>
                  <th className="text-left px-5 py-3 text-xs text-[var(--text-muted)] font-medium">
                    名称
                  </th>
                  <th className="text-left px-5 py-3 text-xs text-[var(--text-muted)] font-medium">
                    类型
                  </th>
                  <th className="text-left px-5 py-3 text-xs text-[var(--text-muted)] font-medium">
                    状态
                  </th>
                  <th className="text-left px-5 py-3 text-xs text-[var(--text-muted)] font-medium">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody>
                {deps.map((dep) => (
                  <tr
                    key={dep.id}
                    className="border-b border-[var(--border)] last:border-0 hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="px-5 py-3">
                      <input
                        type="checkbox"
                        className="accent-indigo-500"
                        checked={selected.includes(dep.id)}
                        onChange={() => toggleSelect(dep.id)}
                      />
                    </td>
                    <td className="px-5 py-3">
                      <div className="font-medium text-[var(--text-primary)]">
                        {dep.name}
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-[var(--text-muted)]">
                        {DEP_TYPE_LABELS[dep.type] || dep.type}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <Badge variant={getStatusInfo(dep.status).variant} dot>
                        {getStatusInfo(dep.status).label}
                      </Badge>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-1">
                        {dep.status === 0 ||
                        dep.status === 3 ||
                        dep.status === 6 ? (
                          <Button
                            variant="outline"
                            size="icon"
                            title="取消"
                            onClick={() => cancelMutation.mutate([dep.id])}
                          >
                            <XCircle size={12} />
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="icon"
                            title="重新安装"
                            onClick={() => reinstallMutation.mutate([dep.id])}
                          >
                            <RefreshCw size={12} />
                          </Button>
                        )}
                        <Button
                          variant="danger"
                          size="icon"
                          title="删除"
                          onClick={() => deleteMutation.mutate([dep.id])}
                        >
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

      {/* Create Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>添加依赖</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {newDeps.map((dep, index) => (
              <div
                key={index}
                className="flex items-start gap-3 p-3 border border-[var(--border)] rounded-lg"
              >
                <div className="flex-1 space-y-3">
                  <Input
                    placeholder="依赖名称，如：axios"
                    value={dep.name}
                    onChange={(e) =>
                      handleDepChange(index, 'name', e.target.value)
                    }
                  />
                  <div className="flex gap-3">
                    <select
                      className="flex-1 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)]"
                      value={dep.type}
                      onChange={(e) =>
                        handleDepChange(index, 'type', Number(e.target.value))
                      }
                    >
                      {DEP_CREATE_TYPES.map((t) => (
                        <option key={t.value} value={t.value}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                    <Input
                      placeholder="备注（可选）"
                      value={dep.remark}
                      onChange={(e) =>
                        handleDepChange(index, 'remark', e.target.value)
                      }
                      className="flex-1"
                    />
                  </div>
                </div>
                {newDeps.length > 1 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveDep(index)}
                  >
                    <XCircle size={14} />
                  </Button>
                )}
              </div>
            ))}
            <Button variant="outline" onClick={handleAddDep} className="w-full">
              <Plus size={13} /> 添加更多
            </Button>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCreateDialogOpen(false)}
            >
              取消
            </Button>
            <Button onClick={handleCreate} disabled={createMutation.isPending}>
              {createMutation.isPending ? '添加中...' : '添加'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
