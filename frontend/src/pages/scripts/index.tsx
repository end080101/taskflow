import { useState, useCallback, useRef } from 'react';
import MonacoEditor, { type OnMount } from '@monaco-editor/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { scriptApi } from '@/services/api';
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
  FolderOpen,
  File,
  FolderPlus,
  FilePlus,
  Trash2,
  Play,
  Square,
  Download,
  RefreshCw,
  ChevronRight,
  Home,
  Pencil,
} from 'lucide-react';
import type { ScriptFile } from '@/types';

export default function Scripts() {
  const qc = useQueryClient();
  const [currentPath, setCurrentPath] = useState('');
  const [selectedFile, setSelectedFile] = useState<ScriptFile | null>(null);
  const [fileContent, setFileContent] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState('');
  const editorRef = useRef<any>(null);

  const handleEditorMount: OnMount = (editor) => {
    editorRef.current = editor;
  };

  // 根据文件扩展名推断语言
  const getEditorLanguage = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase();
    const map: Record<string, string> = {
      js: 'javascript', ts: 'typescript', py: 'python', sh: 'shell',
      bash: 'shell', json: 'json', yaml: 'yaml', yml: 'yaml',
      md: 'markdown', html: 'html', css: 'css', xml: 'xml',
    };
    return map[ext ?? ''] ?? 'plaintext';
  };

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createType, setCreateType] = useState<'file' | 'folder'>('file');
  const [newName, setNewName] = useState('');

  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [renameTarget, setRenameTarget] = useState<ScriptFile | null>(null);
  const [newFilename, setNewFilename] = useState('');

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['scripts', currentPath],
    queryFn: () => scriptApi.list({ path: currentPath }),
  });

  const scripts: ScriptFile[] = data?.data?.data ?? [];

  const createMutation = useMutation({
    mutationFn: (data: {
      filename: string;
      path?: string;
      content?: string;
      directory?: string;
    }) => scriptApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['scripts'] });
      setCreateDialogOpen(false);
      setNewName('');
    },
  });

  const saveMutation = useMutation({
    mutationFn: (data: { filename: string; content: string; path?: string }) =>
      scriptApi.save(data.filename, data.content, data.path),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['scripts'] });
      setIsEditing(false);
      if (selectedFile) {
        loadFileContent(selectedFile);
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (data: { filename: string; path?: string }) =>
      scriptApi.delete(data.filename, data.path),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['scripts'] });
      if (selectedFile) {
        setSelectedFile(null);
        setFileContent('');
      }
    },
  });

  const runMutation = useMutation({
    mutationFn: (data: { filename: string; content?: string; path?: string }) =>
      scriptApi.run(data.filename, data.content, data.path),
    onSuccess: () => alert('脚本已启动'),
  });

  const stopMutation = useMutation({
    mutationFn: (data: { filename: string; path?: string }) =>
      scriptApi.stop(data.filename, data.path),
    onSuccess: () => alert('脚本已停止'),
  });

  const renameMutation = useMutation({
    mutationFn: (data: {
      filename: string;
      newFilename: string;
      path?: string;
    }) => scriptApi.rename(data.filename, data.newFilename, data.path),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['scripts'] });
      setRenameDialogOpen(false);
      setRenameTarget(null);
      setNewFilename('');
    },
  });

  const loadFileContent = useCallback(
    async (file: ScriptFile) => {
      if (file.isDir) return;
      try {
        const result = await scriptApi.getDetail(currentPath, file.filename);
        setFileContent(result.data.data);
        setEditedContent(result.data.data);
      } catch (e) {
        console.error('Failed to load file:', e);
      }
    },
    [currentPath],
  );

  const handleFileClick = (file: ScriptFile) => {
    if (file.isDir) {
      setCurrentPath(
        currentPath ? `${currentPath}/${file.filename}` : file.filename,
      );
      setSelectedFile(null);
      setFileContent('');
    } else {
      setSelectedFile(file);
      loadFileContent(file);
      setIsEditing(false);
    }
  };

  const handleNavigate = (path: string) => {
    setCurrentPath(path);
    setSelectedFile(null);
    setFileContent('');
  };

  const pathParts = currentPath.split('/').filter(Boolean);

  const handleSave = () => {
    if (!selectedFile) return;
    saveMutation.mutate({
      filename: selectedFile.filename,
      content: editedContent,
      path: currentPath,
    });
  };

  const handleCreate = () => {
    if (!newName.trim()) return;
    if (createType === 'folder') {
      createMutation.mutate({
        filename: newName,
        path: currentPath,
        directory: newName,
      });
    } else {
      createMutation.mutate({
        filename: newName,
        path: currentPath,
        content: '',
      });
    }
  };

  const handleRename = () => {
    if (!renameTarget || !newName.trim()) return;
    renameMutation.mutate({
      filename: renameTarget.filename,
      newFilename: newName,
      path: currentPath,
    });
  };

  const openRenameDialog = (file: ScriptFile) => {
    setRenameTarget(file);
    setNewFilename(file.filename);
    setRenameDialogOpen(true);
  };

  const handleDownload = async () => {
    if (!selectedFile) return;
    try {
      await scriptApi.download(selectedFile.filename, currentPath);
    } catch (e) {
      console.error('Failed to download:', e);
    }
  };

  return (
    <div className="flex h-[calc(100vh-140px)] gap-4">
      {/* File Browser */}
      <Card className="w-72 flex-shrink-0 flex flex-col">
        <CardHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <CardTitle>脚本文件</CardTitle>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => refetch()}
                disabled={isFetching}
              >
                <RefreshCw
                  size={14}
                  className={isFetching ? 'animate-spin' : ''}
                />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setCreateType('folder');
                  setCreateDialogOpen(true);
                }}
                title="新建文件夹"
              >
                <FolderPlus size={14} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setCreateType('file');
                  setCreateDialogOpen(true);
                }}
                title="新建文件"
              >
                <FilePlus size={14} />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex-1 overflow-auto p-0">
          {/* Breadcrumb */}
          <div className="px-4 py-2 border-b border-[var(--border)] flex items-center gap-1 text-xs">
            <button
              onClick={() => handleNavigate('')}
              className="text-indigo-400 hover:underline flex items-center gap-1"
            >
              <Home size={12} /> 根目录
            </button>
            {pathParts.map((part, i) => (
              <span key={i} className="flex items-center gap-1">
                <ChevronRight size={10} className="text-[var(--text-muted)]" />
                <button
                  onClick={() =>
                    handleNavigate(pathParts.slice(0, i + 1).join('/'))
                  }
                  className="text-indigo-400 hover:underline"
                >
                  {part}
                </button>
              </span>
            ))}
          </div>

          {isLoading ? (
            <div className="text-center py-8 text-[var(--text-muted)] text-sm">
              加载中...
            </div>
          ) : scripts.length === 0 ? (
            <div className="text-center py-8 text-[var(--text-muted)] text-sm">
              暂无文件
            </div>
          ) : (
            <div className="py-1">
              {scripts.map((file) => (
                <div
                  key={file.filename}
                  className="flex items-center gap-2 px-4 py-1.5 hover:bg-white/[0.02] cursor-pointer group"
                  onClick={() => handleFileClick(file)}
                >
                  {file.isDir ? (
                    <FolderOpen
                      size={14}
                      className="text-yellow-500 flex-shrink-0"
                    />
                  ) : (
                    <File size={14} className="text-indigo-400 flex-shrink-0" />
                  )}
                  <span className="text-sm text-[var(--text-primary)] truncate flex-1">
                    {file.filename}
                  </span>
                  <div className="hidden group-hover:flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5"
                      onClick={(e) => {
                        e.stopPropagation();
                        openRenameDialog(file);
                      }}
                    >
                      <Pencil size={10} />
                    </Button>
                    {!file.isDir && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleFileClick(file);
                          runMutation.mutate({
                            filename: file.filename,
                            path: currentPath,
                          });
                        }}
                      >
                        <Play size={10} />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5 text-red-400"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteMutation.mutate({
                          filename: file.filename,
                          path: currentPath,
                        });
                      }}
                    >
                      <Trash2 size={10} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Editor */}
      <Card className="flex-1 flex flex-col min-w-0">
        <CardHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <CardTitle>
              {selectedFile ? selectedFile.filename : '脚本编辑器'}
            </CardTitle>
            {selectedFile && (
              <div className="flex items-center gap-1">
                {isEditing ? (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditing(false)}
                    >
                      取消
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSave}
                      disabled={saveMutation.isPending}
                    >
                      {saveMutation.isPending ? '保存中...' : '保存'}
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleDownload}
                      title="下载"
                    >
                      <Download size={14} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        runMutation.mutate({
                          filename: selectedFile.filename,
                          content: fileContent,
                          path: currentPath,
                        })
                      }
                      title="运行"
                    >
                      <Play size={14} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setIsEditing(true)}
                      title="编辑"
                    >
                      <Pencil size={14} />
                    </Button>
                  </>
                )}
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="flex-1 min-h-0 p-0 overflow-hidden">
          {selectedFile ? (
            <MonacoEditor
              height="100%"
              language={getEditorLanguage(selectedFile.filename)}
              value={isEditing ? editedContent : fileContent}
              theme="vs-dark"
              onChange={(val) => isEditing && setEditedContent(val ?? '')}
              onMount={handleEditorMount}
              options={{
                readOnly: !isEditing,
                fontSize: 13,
                fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                lineNumbers: 'on',
                wordWrap: 'on',
                padding: { top: 12, bottom: 12 },
                smoothScrolling: true,
                cursorBlinking: 'smooth',
                renderLineHighlight: isEditing ? 'all' : 'none',
              }}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-[var(--text-muted)]">
              选择一个文件进行编辑
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent onOpenAutoFocus={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>
              {createType === 'folder' ? '新建文件夹' : '新建文件'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder={createType === 'folder' ? '文件夹名称' : '文件名称'}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCreateDialogOpen(false)}
            >
              取消
            </Button>
            <Button onClick={handleCreate} disabled={createMutation.isPending}>
              {createMutation.isPending ? '创建中...' : '创建'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename Dialog */}
      <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
        <DialogContent onOpenAutoFocus={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>重命名</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              value={newFilename}
              onChange={(e) => setNewFilename(e.target.value)}
              placeholder="新名称"
              onKeyDown={(e) => e.key === 'Enter' && handleRename()}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRenameDialogOpen(false)}
            >
              取消
            </Button>
            <Button onClick={handleRename} disabled={renameMutation.isPending}>
              {renameMutation.isPending ? '重命名中...' : '重命名'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
