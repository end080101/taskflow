import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { envApi } from '@/services/api';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import type { EnvItem } from '@/types';

interface EnvModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingEnv?: EnvItem | null;
}

export function EnvModal({ open, onOpenChange, editingEnv }: EnvModalProps) {
  const qc = useQueryClient();
  const [name, setName] = useState('');
  const [value, setValue] = useState('');
  const [remarks, setRemarks] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (editingEnv) {
      setName(editingEnv.name);
      setValue(editingEnv.value);
      setRemarks(editingEnv.remarks || '');
    } else {
      setName('');
      setValue('');
      setRemarks('');
    }
  }, [editingEnv, open]);

  const createMutation = useMutation({
    mutationFn: (data: Partial<EnvItem>) => envApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['envs'] });
      onOpenChange(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: Partial<EnvItem>) => envApi.update(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['envs'] });
      onOpenChange(false);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const data = {
      name,
      value,
      remarks: remarks || undefined,
    };

    try {
      if (editingEnv) {
        await updateMutation.mutateAsync({ ...data, id: editingEnv.id });
      } else {
        await createMutation.mutateAsync([data] as any);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onOpenAutoFocus={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>{editingEnv ? '编辑变量' : '新增变量'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-[var(--text-primary)]">
              变量名
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="JD_COOKIE"
              required
              disabled={!!editingEnv}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-[var(--text-primary)]">
              变量值
            </label>
            <Input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="输入变量值"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-[var(--text-primary)]">
              备注
            </label>
            <Input
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="可选备注"
            />
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
              {isSubmitting ? '保存中...' : editingEnv ? '保存' : '创建'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
