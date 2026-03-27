import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'

export default function Settings() {
  return (
    <Card>
      <CardHeader><CardTitle>系统设置</CardTitle></CardHeader>
      <CardContent>
        <div className="text-center py-12 text-[var(--text-muted)] text-sm">功能开发中...</div>
      </CardContent>
    </Card>
  )
}
