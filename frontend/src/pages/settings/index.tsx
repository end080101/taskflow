import { useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { notificationApi, systemApi } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Bell, Globe, Info, RefreshCw, Send, Zap } from 'lucide-react';
import type { SystemInfo } from '@/types';

const NOTIFICATION_TYPES = [
  { value: '', label: '不启用' },
  { value: 'bark', label: 'Bark' },
  { value: 'pushPlus', label: 'PushPlus' },
  { value: 'serverChan', label: 'Server酱' },
  { value: 'telegramBot', label: 'Telegram Bot' },
  { value: 'dingtalkBot', label: '钉钉群机器人' },
  { value: 'weWorkBot', label: '企业微信群机器人' },
  { value: 'feishu', label: '飞书' },
  { value: 'email', label: '邮件' },
  { value: 'webhook', label: 'Webhook' },
];

export default function Settings() {
  const [mirrorSaving, setMirrorSaving] = useState<string | null>(null);
  const [reloadLoading, setReloadLoading] = useState(false);
  const [notifySaving, setNotifySaving] = useState(false);

  const {
    data: systemData,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['system'],
    queryFn: () => systemApi.info(),
  });

  const { data: configData, refetch: refetchConfig } = useQuery({
    queryKey: ['systemConfig'],
    queryFn: () => systemApi.config(),
  });

  const { data: notifyData, refetch: refetchNotify } = useQuery({
    queryKey: ['notification'],
    queryFn: () => notificationApi.get(),
  });

  const systemInfo: SystemInfo = systemData?.data?.data ?? {};
  const config =
    (configData?.data?.data as { info?: Record<string, string> } | undefined)
      ?.info ?? {};
  const [mirrorDraft, setMirrorDraft] = useState<Record<string, string>>({});
  const [notifyTypeDraft, setNotifyTypeDraft] = useState<string | null>(null);
  const [notifyParamDrafts, setNotifyParamDrafts] = useState<
    Record<string, string>
  >({});

  const nodeMirror = mirrorDraft.nodeMirror ?? config.nodeMirror ?? '';
  const pythonMirror = mirrorDraft.pythonMirror ?? config.pythonMirror ?? '';
  const linuxMirror = mirrorDraft.linuxMirror ?? config.linuxMirror ?? '';
  const dependenceProxy =
    mirrorDraft.dependenceProxy ?? config.dependenceProxy ?? '';

  const baseNotify = useMemo(() => {
    const data = (notifyData?.data?.data ?? {}) as Record<string, unknown>;
    const params: Record<string, string> = {};

    Object.keys(data).forEach((key) => {
      if (key !== 'type' && typeof data[key] === 'string' && data[key]) {
        params[key] = data[key] as string;
      }
    });

    return {
      type: typeof data.type === 'string' ? data.type : '',
      params,
    };
  }, [notifyData]);

  const notifyType = notifyTypeDraft ?? baseNotify.type;
  const notifyParams = { ...baseNotify.params, ...notifyParamDrafts };

  const updateNotifyMutation = useMutation({
    mutationFn: (data: Record<string, string>) => notificationApi.update(data),
    onSuccess: () => {
      setNotifySaving(false);
      setNotifyTypeDraft(null);
      setNotifyParamDrafts({});
      refetchNotify();
      alert('通知设置已保存');
    },
    onError: () => {
      setNotifySaving(false);
      alert('保存失败');
    },
  });

  const updateNodeMirrorMutation = useMutation({
    mutationFn: (value: string) => systemApi.updateNodeMirror(value),
    onSettled: () => {
      setMirrorSaving(null);
      refetchConfig();
    },
    onSuccess: () => alert('Node 镜像源已更新'),
    onError: () => alert('更新失败'),
  });

  const updatePythonMirrorMutation = useMutation({
    mutationFn: (value: string) => systemApi.updatePythonMirror(value),
    onSettled: () => {
      setMirrorSaving(null);
      refetchConfig();
    },
    onSuccess: () => alert('Python 镜像源已更新'),
    onError: () => alert('更新失败'),
  });

  const updateLinuxMirrorMutation = useMutation({
    mutationFn: (value: string) => systemApi.updateLinuxMirror(value),
    onSettled: () => {
      setMirrorSaving(null);
      refetchConfig();
    },
    onSuccess: () => alert('Linux 镜像源已更新'),
    onError: () => alert('更新失败'),
  });

  const updateDependenceProxyMutation = useMutation({
    mutationFn: (value: string) => systemApi.updateDependenceProxy(value),
    onSettled: () => {
      setMirrorSaving(null);
      refetchConfig();
    },
    onSuccess: () => alert('依赖代理已更新'),
    onError: () => alert('更新失败'),
  });

  const reloadMutation = useMutation({
    mutationFn: () => systemApi.reload(),
    onSettled: () => setReloadLoading(false),
    onSuccess: () => alert('系统已重载'),
    onError: () => alert('重载失败'),
  });

  const handleSaveMirror = (type: string) => {
    setMirrorSaving(type);
    switch (type) {
      case 'node':
        updateNodeMirrorMutation.mutate(nodeMirror);
        break;
      case 'python':
        updatePythonMirrorMutation.mutate(pythonMirror);
        break;
      case 'linux':
        updateLinuxMirrorMutation.mutate(linuxMirror);
        break;
      case 'proxy':
        updateDependenceProxyMutation.mutate(dependenceProxy);
        break;
    }
  };

  const handleSaveNotify = () => {
    setNotifySaving(true);
    updateNotifyMutation.mutate({
      type: notifyType,
      ...notifyParams,
    });
  };

  const getNotifyFields = () => {
    switch (notifyType) {
      case 'bark':
        return [
          {
            key: 'barkPush',
            label: 'Bark URL',
            placeholder: 'https://api.day.app/你的KEY',
          },
          { key: 'barkSound', label: '声音', placeholder: 'alarm' },
        ];
      case 'pushPlus':
        return [
          {
            key: 'pushPlusToken',
            label: 'Token',
            placeholder: 'PushPlus token',
          },
        ];
      case 'serverChan':
        return [
          {
            key: 'serverChanKey',
            label: 'Server酱 Key',
            placeholder: 'SCUxxx',
          },
        ];
      case 'telegramBot':
        return [
          {
            key: 'telegramBotToken',
            label: 'Bot Token',
            placeholder: '123456:ABC-DEF',
          },
          {
            key: 'telegramBotUserId',
            label: 'User ID',
            placeholder: '123456789',
          },
        ];
      case 'dingtalkBot':
        return [
          { key: 'dingtalkBotToken', label: 'Robot Token', placeholder: 'xxx' },
          { key: 'dingtalkBotSecret', label: 'Secret', placeholder: 'SECxxx' },
        ];
      case 'weWorkBot':
        return [
          { key: 'weWorkBotKey', label: 'Robot Key', placeholder: 'xxx' },
        ];
      case 'feishu':
        return [
          { key: 'larkKey', label: 'Lark Key', placeholder: 'xxx' },
          { key: 'larkSecret', label: 'Lark Secret', placeholder: 'xxx' },
        ];
      case 'email':
        return [
          {
            key: 'emailService',
            label: 'SMTP 服务器',
            placeholder: 'smtp.example.com',
          },
          {
            key: 'emailUser',
            label: '用户名',
            placeholder: 'user@example.com',
          },
          { key: 'emailPass', label: '密码', placeholder: 'password' },
          { key: 'emailTo', label: '收件人', placeholder: 'to@example.com' },
        ];
      case 'webhook':
        return [
          {
            key: 'webhookUrl',
            label: 'Webhook URL',
            placeholder: 'https://xxx.com/webhook',
          },
        ];
      default:
        return [];
    }
  };

  const notifyFields = getNotifyFields();

  return (
    <div className="space-y-4 max-w-4xl">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>系统信息</CardTitle>
            <Button variant="ghost" size="icon" onClick={() => refetch()}>
              <RefreshCw size={14} />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-[var(--text-muted)] text-sm">
              加载中...
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <InfoItem label="版本" value={systemInfo.version || '—'} />
              <InfoItem label="分支" value={systemInfo.branch || '—'} />
              <InfoItem
                label="发布时间"
                value={
                  systemInfo.publishTime
                    ? new Date(systemInfo.publishTime * 1000).toLocaleString(
                        'zh-CN',
                      )
                    : '—'
                }
              />
              <InfoItem
                label="初始化状态"
                value={
                  systemInfo.isInitialized === false ? '待初始化' : '已就绪'
                }
              />
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell size={16} className="text-indigo-400" />
            <CardTitle>通知设置</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-[var(--text-primary)]">
              通知方式
            </label>
            <select
              className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)]"
              value={notifyType}
              onChange={(e) => setNotifyTypeDraft(e.target.value)}
            >
              {NOTIFICATION_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          {notifyFields.map((field) => (
            <div key={field.key} className="space-y-2">
              <label className="text-sm font-medium text-[var(--text-primary)]">
                {field.label}
              </label>
              <Input
                value={notifyParams[field.key] || ''}
                onChange={(e) =>
                  setNotifyParamDrafts((prev) => ({
                    ...prev,
                    [field.key]: e.target.value,
                  }))
                }
                placeholder={field.placeholder}
              />
            </div>
          ))}

          <Button onClick={handleSaveNotify} disabled={notifySaving}>
            <Send size={14} />
            {notifySaving ? '保存中...' : '保存通知设置'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Globe size={16} className="text-indigo-400" />
            <CardTitle>镜像源配置</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <SettingRow
            label="Node.js 镜像"
            value={nodeMirror}
            onChange={(value) =>
              setMirrorDraft((prev) => ({ ...prev, nodeMirror: value }))
            }
            placeholder="https://registry.npmmirror.com"
            loading={mirrorSaving === 'node'}
            onSave={() => handleSaveMirror('node')}
          />
          <SettingRow
            label="Python 镜像"
            value={pythonMirror}
            onChange={(value) =>
              setMirrorDraft((prev) => ({ ...prev, pythonMirror: value }))
            }
            placeholder="https://pypi.tuna.tsinghua.edu.cn/simple"
            loading={mirrorSaving === 'python'}
            onSave={() => handleSaveMirror('python')}
          />
          <SettingRow
            label="Linux 镜像"
            value={linuxMirror}
            onChange={(value) =>
              setMirrorDraft((prev) => ({ ...prev, linuxMirror: value }))
            }
            placeholder="https://mirrors.tuna.tsinghua.edu.cn"
            loading={mirrorSaving === 'linux'}
            onSave={() => handleSaveMirror('linux')}
          />
          <SettingRow
            label="依赖代理"
            value={dependenceProxy}
            onChange={(value) =>
              setMirrorDraft((prev) => ({ ...prev, dependenceProxy: value }))
            }
            placeholder="http://127.0.0.1:7890"
            loading={mirrorSaving === 'proxy'}
            onSave={() => handleSaveMirror('proxy')}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Zap size={16} className="text-indigo-400" />
            <CardTitle>系统操作</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <Button
            variant="outline"
            onClick={() => {
              setReloadLoading(true);
              reloadMutation.mutate();
            }}
            disabled={reloadLoading}
          >
            <RefreshCw
              size={14}
              className={reloadLoading ? 'animate-spin' : ''}
            />
            {reloadLoading ? '重载中...' : '重载系统'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>关于</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex items-start gap-2">
              <Info size={14} className="text-[var(--text-muted)] mt-0.5" />
              <div className="text-[var(--text-secondary)]">
                TaskFlow 是一个基于 Qinglong 的定时任务管理平台，支持
                Python3、JavaScript、Shell、Typescript。
              </div>
            </div>
            {systemInfo.changeLog && (
              <div className="pt-2 border-t border-[var(--border)]">
                <div className="text-xs text-[var(--text-muted)] mb-1">
                  更新日志
                </div>
                <div className="text-xs text-[var(--text-secondary)] whitespace-pre-wrap">
                  {systemInfo.changeLog}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <div className="text-xs text-[var(--text-muted)]">{label}</div>
      <div className="text-sm font-medium text-[var(--text-primary)]">
        {value}
      </div>
    </div>
  );
}

function SettingRow({
  label,
  value,
  onChange,
  placeholder,
  loading,
  onSave,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  loading: boolean;
  onSave: () => void;
}) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-[var(--text-primary)]">
        {label}
      </label>
      <div className="flex gap-2">
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1"
        />
        <Button onClick={onSave} disabled={loading}>
          {loading ? '保存中...' : '保存'}
        </Button>
      </div>
    </div>
  );
}
