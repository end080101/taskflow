import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { cronApi } from '@/services/api';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import type { CronJob } from '@/types';

interface TaskModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingTask?: CronJob | null;
}

export function TaskModal({ open, onOpenChange, editingTask }: TaskModalProps) {
  const qc = useQueryClient();
  const [name, setName] = useState('');
  const [command, setCommand] = useState('');
  const [schedule, setSchedule] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (editingTask) {
      setName(editingTask.name);
      setCommand(editingTask.command);
      setSchedule(editingTask.schedule);
    } else {
      setName('');
      setCommand('');
      setSchedule('');
    }
  }, [editingTask, open]);

  const createMutation = useMutation({
    mutationFn: (data: Partial<CronJob>) => cronApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['crons'] });
      onOpenChange(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: Partial<CronJob>) => cronApi.update(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['crons'] });
      onOpenChange(false);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const data = { name, command, schedule };

    try {
      if (editingTask) {
        await updateMutation.mutateAsync({ ...data, id: editingTask.id });
      } else {
        await createMutation.mutateAsync(data);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onOpenAutoFocus={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>{editingTask ? '编辑任务' : '新建任务'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-[var(--text-primary)]">
              任务名称
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="输入任务名称"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-[var(--text-primary)]">
              执行命令
            </label>
            <Input
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              placeholder="task.sh"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-[var(--text-primary)]">
              cron 表达式
            </label>
            <Input
              value={schedule}
              onChange={(e) => setSchedule(e.target.value)}
              placeholder="0 * * * *"
              required
            />
            <p className="text-xs text-[var(--text-muted)]">
              格式: 分 时 日 月 周 , 例如:{' '}
              <code className="text-indigo-400">0 * * * *</code>{' '}
              表示每小时的整点
            </p>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              取消
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? '保存中...' : editingTask ? '保存' : '创建'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
