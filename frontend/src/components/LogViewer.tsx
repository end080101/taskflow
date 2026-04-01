import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { logApi } from '@/services/api';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { RefreshCw, Download, ArrowDown, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LogViewerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  log: {
    name: string;
    path?: string;
    file?: string;
    isRunning?: boolean;
  } | null;
}

// ANSI 颜色代码转 HTML
const ANSI_REGEX = new RegExp(
  `${String.fromCharCode(27)}\\[(\\d+)(;\\d+)*m`,
  'g',
);

function ansiToHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(ANSI_REGEX, (_, code) => {
      const codes: Record<string, string> = {
        '0': '</span>',
        '1': '<span style="font-weight:bold">',
        '31': '<span style="color:#f87171">',
        '32': '<span style="color:#4ade80">',
        '33': '<span style="color:#fbbf24">',
        '34': '<span style="color:#60a5fa">',
        '35': '<span style="color:#a78bfa">',
        '36': '<span style="color:#34d399">',
        '37': '<span style="color:#e2e8f0">',
        '90': '<span style="color:#6b7280">',
        '91': '<span style="color:#fca5a5">',
        '92': '<span style="color:#86efac">',
      };
      return codes[String(code)] ?? '';
    });
}

export function LogViewer({ open, onOpenChange, log }: LogViewerProps) {
  const [autoScroll, setAutoScroll] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['log-detail', log?.path, log?.file],
    queryFn: () => {
      if (!log) return Promise.resolve(null);
      return logApi.getDetail(log.path || '', log.file || log.name);
    },
    enabled: !!open && !!log,
    staleTime: 0,
    refetchInterval: open && log?.isRunning ? 2000 : false,
  });

  // 打开时初始化
  useEffect(() => {
    if (open && log) {
      refetch();
    }
  }, [open, log, refetch]);

  const content = useMemo(() => data?.data?.data || '', [data]);

  // 自动滚动到底部
  useEffect(() => {
    if (autoScroll && containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [content, autoScroll]);

  // 用户手动滚动时关闭自动滚动
  const handleScroll = () => {
    if (!containerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    const nearBottom = scrollHeight - scrollTop - clientHeight < 60;
    setAutoScroll(nearBottom);
  };

  const handleDownload = () => {
    if (!log) return;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = log.file || log.name;
    a.click();
    URL.revokeObjectURL(url);
  };

  const scrollToBottom = () => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
      setAutoScroll(true);
    }
  };

  const lineCount = content.split('\n').length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center justify-between pr-8">
            <div className="flex items-center gap-2">
              <DialogTitle className="text-base">
                {log?.name || '日志查看'}
              </DialogTitle>
              {log?.isRunning && (
                <span className="flex items-center gap-1 text-xs text-green-400">
                  <Circle size={6} className="fill-green-400 animate-pulse" />
                  自动刷新
                </span>
              )}
              <span className="text-xs text-[var(--text-muted)]">
                {lineCount} 行
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => refetch()}
                disabled={isFetching}
                title="刷新"
              >
                <RefreshCw
                  size={14}
                  className={isFetching ? 'animate-spin' : ''}
                />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleDownload}
                title="下载"
              >
                <Download size={14} />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 relative overflow-hidden rounded-lg border border-[var(--border)] bg-[#0d0d14]">
          {isLoading ? (
            <div className="flex items-center justify-center h-full text-[var(--text-muted)]">
              加载中...
            </div>
          ) : (
            <div
              ref={containerRef}
              onScroll={handleScroll}
              className="w-full h-full overflow-auto p-4 text-xs font-mono leading-5"
            >
              {content ? (
                <pre
                  className="text-[var(--text-secondary)] whitespace-pre-wrap break-words"
                  dangerouslySetInnerHTML={{ __html: ansiToHtml(content) }}
                />
              ) : (
                <span className="text-[var(--text-muted)]">暂无日志内容</span>
              )}
            </div>
          )}

          {/* 滚动到底部按钮 */}
          {!autoScroll && content && (
            <button
              onClick={scrollToBottom}
              className={cn(
                'absolute bottom-4 right-4 flex items-center gap-1.5 px-3 py-1.5',
                'bg-indigo-600/80 hover:bg-indigo-600 text-white text-xs rounded-full',
                'backdrop-blur-sm transition-all shadow-lg',
              )}
            >
              <ArrowDown size={12} /> 滚到底部
            </button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
