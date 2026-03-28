import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { systemApi, authApi, notificationApi } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/Dialog';
import {
  RefreshCw,
  User,
  Lock,
  Info,
  Globe,
  Zap,
  Bell,
  Send,
} from 'lucide-react';
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
  const qc = useQueryClient();
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
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

  const systemInfo: SystemInfo & {
    isInitialized?: boolean;
    changeLog?: string;
  } = systemData?.data?.data ?? {};

  const config = configData?.data?.data ?? {};
  const [nodeMirror, setNodeMirror] = useState(config.nodeMirror || '');
  const [pythonMirror, setPythonMirror] = useState(config.pythonMirror || '');
  const [linuxMirror, setLinuxMirror] = useState(config.linuxMirror || '');
  const [dependenceProxy, setDependenceProxy] = useState(
    config.dependenceProxy || '',
  );

  const notifyConfig = notifyData?.data?.data || {};
  const [notifyType, setNotifyType] = useState(notifyConfig.type || '');
  const [notifyParams, setNotifyParams] = useState<Record<string, string>>({});

  useEffect(() => {
    if (notifyData?.data?.data) {
      const data = notifyData.data.data;
      setNotifyType(data.type || '');
      const params: Record<string, string> = {};
      Object.keys(data).forEach((key) => {
        if (key !== 'type' && data[key]) {
          params[key] = data[key];
        }
      });
      setNotifyParams(params);
    }
  }, [notifyData]);

  const changePasswordMutation = useMutation({
    mutationFn: (data: { old_password: string; password: string }) =>
      authApi.changePassword(data),
    onSuccess: () => {
      setPasswordDialogOpen(false);
      setOldPassword('');
      setNewPassword('');
      alert('密码修改成功');
    },
    onError: () => {
      alert('密码修改失败');
    },
  });

  const updateNotifyMutation = useMutation({
    mutationFn: (data: any) => notificationApi.update(data),
    onSuccess: () => {
      setNotifySaving(false);
      refetchNotify();
      alert('通知设置已保存');
    },
    onError: () => {
      setNotifySaving(false);
      alert('保存失败');
    },
  });

  const updateNodeMirrorMutation = useMutation({
    mutationFn: (nodeMirror: string) => systemApi.updateNodeMirror(nodeMirror),
    onSuccess: () => {
      setMirrorSaving(null);
      refetchConfig();
      alert('Node 镜像源已更新');
    },
    onError: () => {
      setMirrorSaving(null);
      alert('更新失败');
    },
  });

  const updatePythonMirrorMutation = useMutation({
    mutationFn: (pythonMirror: string) =>
      systemApi.updatePythonMirror(pythonMirror),
    onSuccess: () => {
      setMirrorSaving(null);
      refetchConfig();
      alert('Python 镜像源已更新');
    },
    onError: () => {
      setMirrorSaving(null);
      alert('更新失败');
    },
  });

  const updateLinuxMirrorMutation = useMutation({
    mutationFn: (linuxMirror: string) =>
      systemApi.updateLinuxMirror(linuxMirror),
    onSuccess: () => {
      setMirrorSaving(null);
      refetchConfig();
      alert('Linux 镜像源已更新');
    },
    onError: () => {
      setMirrorSaving(null);
      alert('更新失败');
    },
  });

  const updateDependenceProxyMutation = useMutation({
    mutationFn: (dependenceProxy: string) =>
      systemApi.updateDependenceProxy(dependenceProxy),
    onSuccess: () => {
      setMirrorSaving(null);
      refetchConfig();
      alert('依赖代理已更新');
    },
    onError: () => {
      setMirrorSaving(null);
      alert('更新失败');
    },
  });

  const reloadMutation = useMutation({
    mutationFn: () => systemApi.reload(),
    onSuccess: () => {
      setReloadLoading(false);
      alert('系统已重载');
    },
    onError: () => {
      setReloadLoading(false);
      alert('重载失败');
    },
  });

  const handleChangePassword = () => {
    if (!newPassword.trim()) {
      alert('请输入新密码');
      return;
    }
    changePasswordMutation.mutate({
      old_password: oldPassword,
      password: newPassword,
    });
  };

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
      {/* System Info */}
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
              <div className="space-y-1">
                <div className="text-xs text-[var(--text-muted)]">版本</div>
                <div className="text-sm font-medium text-[var(--text-primary)]">
                  {systemInfo.version || '—'}
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-xs text-[var(--text-muted)]">分支</div>
                <div className="text-sm font-medium text-[var(--text-primary)]">
                  {systemInfo.branch || '—'}
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-xs text-[var(--text-muted)]">
                  Node 版本
                </div>
                <div className="text-sm font-medium text-[var(--text-primary)]">
                  {systemInfo.node_version || '—'}
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-xs text-[var(--text-muted)]">平台</div>
                <div className="text-sm font-medium text-[var(--text-primary)]">
                  {systemInfo.platform || '—'}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notification Settings */}
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
              onChange={(e) => setNotifyType(e.target.value)}
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
                  setNotifyParams((prev) => ({
                    ...prev,
                    [field.key]: e.target.value,
                  }))
                }
                placeholder={field.placeholder}
              />
            </div>
          ))}

          <Button
            onClick={handleSaveNotify}
            disabled={notifySaving || !notifyType}
          >
            <Send size={14} />
            {notifySaving ? '保存中...' : '保存通知设置'}
          </Button>
        </CardContent>
      </Card>

      {/* Mirror Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Globe size={16} className="text-indigo-400" />
            <CardTitle>镜像源配置</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-[var(--text-primary)]">
              Node.js 镜像
            </label>
            <div className="flex gap-2">
              <Input
                value={nodeMirror}
                onChange={(e) => setNodeMirror(e.target.value)}
                placeholder="https://npm.taobao.org/mirrors/node"
                className="flex-1"
              />
              <Button
                onClick={() => handleSaveMirror('node')}
                disabled={mirrorSaving === 'node'}
              >
                {mirrorSaving === 'node' ? '保存中...' : '保存'}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-[var(--text-primary)]">
              Python 镜像
            </label>
            <div className="flex gap-2">
              <Input
                value={pythonMirror}
                onChange={(e) => setPythonMirror(e.target.value)}
                placeholder="https://pypi.tuna.tsinghua.edu.cn/simple"
                className="flex-1"
              />
              <Button
                onClick={() => handleSaveMirror('python')}
                disabled={mirrorSaving === 'python'}
              >
                {mirrorSaving === 'python' ? '保存中...' : '保存'}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-[var(--text-primary)]">
              Linux 镜像
            </label>
            <div className="flex gap-2">
              <Input
                value={linuxMirror}
                onChange={(e) => setLinuxMirror(e.target.value)}
                placeholder="https://mirrors.tuna.tsinghua.edu.cn"
                className="flex-1"
              />
              <Button
                onClick={() => handleSaveMirror('linux')}
                disabled={mirrorSaving === 'linux'}
              >
                {mirrorSaving === 'linux' ? '保存中...' : '保存'}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-[var(--text-primary)]">
              依赖代理
            </label>
            <div className="flex gap-2">
              <Input
                value={dependenceProxy}
                onChange={(e) => setDependenceProxy(e.target.value)}
                placeholder="http://127.0.0.1:7890"
                className="flex-1"
              />
              <Button
                onClick={() => handleSaveMirror('proxy')}
                disabled={mirrorSaving === 'proxy'}
              >
                {mirrorSaving === 'proxy' ? '保存中...' : '保存'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Actions */}
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

      {/* Account Settings */}
      <Card>
        <CardHeader>
          <CardTitle>账户设置</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border border-[var(--border)] rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center">
                  <User size={20} className="text-indigo-400" />
                </div>
                <div>
                  <div className="text-sm font-medium text-[var(--text-primary)]">
                    登录密码
                  </div>
                  <div className="text-xs text-[var(--text-muted)]">
                    修改管理员账户密码
                  </div>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPasswordDialogOpen(true)}
              >
                修改密码
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* About */}
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

      {/* Change Password Dialog */}
      <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
        <DialogContent onOpenAutoFocus={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>修改密码</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-[var(--text-primary)]">
                当前密码
              </label>
              <Input
                type="password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                placeholder="输入当前密码"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-[var(--text-primary)]">
                新密码
              </label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="输入新密码"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPasswordDialogOpen(false)}
            >
              取消
            </Button>
            <Button
              onClick={handleChangePassword}
              disabled={changePasswordMutation.isPending}
            >
              {changePasswordMutation.isPending ? '修改中...' : '修改'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
