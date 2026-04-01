import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cronApi } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { SearchInput } from '@/components/ui/Input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/Dialog';
import { Input } from '@/components/ui/Input';
import {
  Play,
  Square,
  Plus,
  Trash2,
  Pencil,
  Pin,
  PinOff,
  ToggleLeft,
  ToggleRight,
  Tag,
} from 'lucide-react';
import {
  formatDate,
  getCronLastRunTime,
  isCronEnabled,
  isCronRunning,
  parseCron,
} from '@/lib/utils';
import { TaskModal } from '@/components/TaskModal';
import type { CronJob } from '@/types';

export default function Tasks() {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<number[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<CronJob | null>(null);
  const [labelDialogOpen, setLabelDialogOpen] = useState(false);
  const [labelInput, setLabelInput] = useState('');
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['crons', search],
    queryFn: () => cronApi.list({ searchValue: search }),
  });

  const crons: CronJob[] = data?.data?.data?.data ?? [];

  const runMutation = useMutation({
    mutationFn: (ids: number[]) => cronApi.run(ids),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['crons'] }),
  });

  const stopMutation = useMutation({
    mutationFn: (ids: number[]) => cronApi.stop(ids),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['crons'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (ids: number[]) => cronApi.delete(ids),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['crons'] });
      setSelected([]);
    },
  });

  const enableMutation = useMutation({
    mutationFn: (ids: number[]) => cronApi.enable(ids),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['crons'] });
      setSelected([]);
    },
  });

  const disableMutation = useMutation({
    mutationFn: (ids: number[]) => cronApi.disable(ids),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['crons'] });
      setSelected([]);
    },
  });

  const pinMutation = useMutation({
    mutationFn: (ids: number[]) => cronApi.pin(ids),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['crons'] });
      setSelected([]);
    },
  });

  const unpinMutation = useMutation({
    mutationFn: (ids: number[]) => cronApi.unpin(ids),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['crons'] });
      setSelected([]);
    },
  });

  const addLabelsMutation = useMutation({
    mutationFn: ({ ids, labels }: { ids: number[]; labels: string[] }) =>
      cronApi.addLabels(ids, labels),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['crons'] });
      setLabelDialogOpen(false);
      setLabelInput('');
    },
  });

  const toggleSelect = (id: number) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const handleAddLabels = () => {
    if (!labelInput.trim() || selected.length === 0) return;
    const labels = labelInput
      .split(',')
      .map((l) => l.trim())
      .filter(Boolean);
    addLabelsMutation.mutate({ ids: selected, labels });
  };

  const handlePinToggle = (cron: CronJob) => {
    if (cron.isPinned) {
      unpinMutation.mutate([cron.id]);
    } else {
      pinMutation.mutate([cron.id]);
    }
  };

  const getAllLabels = () => {
    const labels = new Set<string>();
    crons.forEach((c) => c.labels?.forEach((l) => labels.add(l)));
    return Array.from(labels);
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <SearchInput
          placeholder="搜索任务名称..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-64"
        />
        <div className="flex-1" />
        {selected.length > 0 ? (
          <>
            <span className="text-xs text-[var(--text-muted)]">
              已选 {selected.length}
            </span>
            <Button
              variant="success"
              size="sm"
              onClick={() => runMutation.mutate(selected)}
            >
              <Play size={13} /> 运行
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => stopMutation.mutate(selected)}
            >
              <Square size={13} /> 停止
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => enableMutation.mutate(selected)}
            >
              <ToggleRight size={13} /> 启用
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => disableMutation.mutate(selected)}
            >
              <ToggleLeft size={13} /> 禁用
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLabelDialogOpen(true)}
            >
              <Tag size={13} /> 标签
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => deleteMutation.mutate(selected)}
            >
              <Trash2 size={13} /> 删除
            </Button>
          </>
        ) : null}
        <Button
          size="sm"
          onClick={() => {
            setEditingTask(null);
            setModalOpen(true);
          }}
        >
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
            <div className="text-center py-12 text-[var(--text-muted)] text-sm">
              加载中...
            </div>
          ) : crons.length === 0 ? (
            <div className="text-center py-12 text-[var(--text-muted)] text-sm">
              暂无定时任务
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
                        selected.length === crons.length && crons.length > 0
                      }
                      onChange={(e) =>
                        setSelected(
                          e.target.checked ? crons.map((c) => c.id) : [],
                        )
                      }
                    />
                  </th>
                  <th className="text-left px-5 py-3 text-xs text-[var(--text-muted)] font-medium w-8">
                    置顶
                  </th>
                  <th className="text-left px-5 py-3 text-xs text-[var(--text-muted)] font-medium">
                    任务名称
                  </th>
                  <th className="text-left px-5 py-3 text-xs text-[var(--text-muted)] font-medium">
                    命令
                  </th>
                  <th className="text-left px-5 py-3 text-xs text-[var(--text-muted)] font-medium">
                    标签
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
                  <th className="text-left px-5 py-3 text-xs text-[var(--text-muted)] font-medium">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody>
                {crons.map((cron) => (
                  <tr
                    key={cron.id}
                    className="border-b border-[var(--border)] last:border-0 hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="px-5 py-3">
                      <input
                        type="checkbox"
                        className="accent-indigo-500"
                        checked={selected.includes(cron.id)}
                        onChange={() => toggleSelect(cron.id)}
                      />
                    </td>
                    <td className="px-5 py-3">
                      <Button
                        variant="ghost"
                        size="icon"
                        title={cron.isPinned ? '取消置顶' : '置顶'}
                        onClick={() => handlePinToggle(cron)}
                        className={cron.isPinned ? 'text-indigo-400' : ''}
                      >
                        {cron.isPinned ? (
                          <Pin size={12} />
                        ) : (
                          <PinOff size={12} />
                        )}
                      </Button>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        {isCronRunning(cron) && (
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse flex-shrink-0" />
                        )}
                        <span className="font-medium text-[var(--text-primary)] truncate max-w-[160px]">
                          {cron.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <code className="text-xs text-[var(--text-muted)] font-mono truncate max-w-[200px] block">
                        {cron.command}
                      </code>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex flex-wrap gap-1 max-w-[150px]">
                        {cron.labels?.slice(0, 3).map((label) => (
                          <span
                            key={label}
                            className="px-1.5 py-0.5 text-xs bg-indigo-500/20 text-indigo-400 rounded"
                          >
                            {label}
                          </span>
                        ))}
                        {cron.labels && cron.labels.length > 3 && (
                          <span className="text-xs text-[var(--text-muted)]">
                            +{cron.labels.length - 3}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex flex-col">
                        <code className="text-xs text-indigo-400 font-mono">
                          {cron.schedule}
                        </code>
                        <span className="text-xs text-[var(--text-muted)]">
                          {parseCron(cron.schedule)}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-xs text-[var(--text-muted)]">
                      {getCronLastRunTime(cron)
                        ? formatDate(getCronLastRunTime(cron) as number)
                        : '从未运行'}
                    </td>
                    <td className="px-5 py-3">
                      {isCronRunning(cron) ? (
                        <Badge variant="running" dot>
                          运行中
                        </Badge>
                      ) : (
                        <Badge
                          variant={isCronEnabled(cron) ? 'success' : 'default'}
                          dot
                        >
                          {isCronEnabled(cron) ? '已启用' : '已禁用'}
                        </Badge>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-1">
                        {isCronRunning(cron) ? (
                          <Button
                            variant="outline"
                            size="icon"
                            title="停止"
                            onClick={() => stopMutation.mutate([cron.id])}
                          >
                            <Square size={12} />
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="icon"
                            title="运行"
                            onClick={() => runMutation.mutate([cron.id])}
                          >
                            <Play size={12} />
                          </Button>
                        )}
                        <Button
                          variant={isCronEnabled(cron) ? 'ghost' : 'outline'}
                          size="icon"
                          title={isCronEnabled(cron) ? '禁用' : '启用'}
                          onClick={() =>
                            isCronEnabled(cron)
                              ? disableMutation.mutate([cron.id])
                              : enableMutation.mutate([cron.id])
                          }
                        >
                          {isCronEnabled(cron) ? (
                            <ToggleRight size={12} />
                          ) : (
                            <ToggleLeft size={12} />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          title="编辑"
                          onClick={() => {
                            setEditingTask(cron);
                            setModalOpen(true);
                          }}
                        >
                          <Pencil size={12} />
                        </Button>
                        <Button
                          variant="danger"
                          size="icon"
                          title="删除"
                          onClick={() => deleteMutation.mutate([cron.id])}
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
      <TaskModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        editingTask={editingTask}
      />

      {/* Label Dialog */}
      <Dialog open={labelDialogOpen} onOpenChange={setLabelDialogOpen}>
        <DialogContent onOpenAutoFocus={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>添加标签</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-[var(--text-primary)]">
                输入标签（用逗号分隔多个）
              </label>
              <Input
                value={labelInput}
                onChange={(e) => setLabelInput(e.target.value)}
                placeholder="jd, tx, 京东"
                onKeyDown={(e) => e.key === 'Enter' && handleAddLabels()}
              />
            </div>
            {getAllLabels().length > 0 && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--text-primary)]">
                  现有标签（点击快速添加）
                </label>
                <div className="flex flex-wrap gap-2">
                  {getAllLabels().map((label) => (
                    <button
                      key={label}
                      onClick={() =>
                        setLabelInput((prev) =>
                          prev ? `${prev}, ${label}` : label,
                        )
                      }
                      className="px-2 py-1 text-xs bg-[var(--bg-secondary)] border border-[var(--border)] rounded hover:border-indigo-500/50 transition-colors"
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLabelDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleAddLabels}>
              添加到 {selected.length} 个任务
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
