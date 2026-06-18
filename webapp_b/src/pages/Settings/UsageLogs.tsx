import { useState, useEffect, useCallback } from 'react'
import { listUsageLogs, getUsageSummary, ApiUsageLog, ApiUsageSummary } from '../../utils/api'
import './Settings.css'

function TypeBadge({ type }: { type: string }) {
  const map: Record<string, { bg: string; text: string }> = {
    '报告生成': { bg: '#eff6ff', text: '#2563eb' },
    '材料整理': { bg: '#f0fdf4', text: '#16a34a' },
    'API调用':  { bg: '#fdf4ff', text: '#9333ea' },
  }
  const c = map[type] || { bg: '#f8fafc', text: '#64748b' }
  return <span className="badge" style={{ background: c.bg, color: c.text }}>{type}</span>
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; text: string }> = {
    '待处理': { bg: '#fffbeb', text: '#d97706' },
    '已导出': { bg: '#f0fdf4', text: '#16a34a' },
    '调用成功': { bg: '#eff6ff', text: '#2563eb' },
  }
  const c = map[status] || { bg: '#f8fafc', text: '#64748b' }
  return <span className="badge" style={{ background: c.bg, color: c.text }}>{status}</span>
}

function Spinner() {
  return <div className="spinner-wrap"><div className="spinner" /></div>
}

const LOG_TYPES = ['全部', '报告生成', '材料整理', 'API调用']

function formatDate(iso: string) {
  try {
    const d = new Date(iso)
    return d.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
  } catch { return '—' }
}

export default function UsageLogs() {
  const [logs, setLogs] = useState<ApiUsageLog[]>([])
  const [total, setTotal] = useState(0)
  const [summary, setSummary] = useState<ApiUsageSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [page, setPage] = useState(1)
  const pageSize = 20

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400)
    return () => clearTimeout(t)
  }, [search])

  useEffect(() => { setPage(1) }, [typeFilter, debouncedSearch])

  const loadLogs = useCallback(async () => {
    setLoading(true)
    setErr('')
    try {
      const res = await listUsageLogs({
        type: typeFilter || undefined,
        keyword: debouncedSearch || undefined,
        page,
        pageSize,
      })
      setLogs(res.items)
      setTotal(res.total)
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : '加载失败')
    } finally {
      setLoading(false)
    }
  }, [typeFilter, debouncedSearch, page, pageSize])

  useEffect(() => { loadLogs() }, [loadLogs])

  useEffect(() => {
    getUsageSummary()
      .then(setSummary)
      .catch(() => setSummary(null))
  }, [])

  const totalPages = Math.ceil(total / pageSize)

  const metrics = [
    { label: '本月总调用', value: summary?.totalThisMonth ?? '—', color: '#0f172a', bg: '#f8fafc' },
    { label: '报告生成', value: summary?.reportCount ?? '—', color: '#2563eb', bg: '#eff6ff' },
    { label: '材料整理', value: summary?.packageCount ?? '—', color: '#16a34a', bg: '#f0fdf4' },
    { label: 'API调用', value: summary?.apiCount ?? '—', color: '#9333ea', bg: '#fdf4ff' },
  ]

  return (
    <div className="settings-page">
      <div className="page-header">
        <h1 className="page-title">调用记录</h1>
        <button className="btn btn-outline" onClick={() => window.open('/api/v1/settings/usage-logs/export', '_blank')}>
          ↓ 导出记录
        </button>
      </div>

      <div className="metrics-grid-4">
        {metrics.map(m => (
          <div key={m.label} className="metric-card" style={{ borderTop: `3px solid ${m.color}`, background: m.bg }}>
            <div className="metric-value" style={{ color: m.color }}>{m.value}</div>
            <div className="metric-label">{m.label}</div>
            <div className="metric-desc">{summary?.resetDate ? `重置日：${summary.resetDate}` : '本月统计'}</div>
          </div>
        ))}
      </div>

      <div className="section">
        <div className="section-header">
          <h2 className="section-title">调用明细</h2>
          <span className="section-desc">共 {total} 条记录</span>
        </div>
        <div className="card toolbar-card">
          <input
            className="toolbar-search"
            placeholder="搜索客户或操作人..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <select className="toolbar-select" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
            {LOG_TYPES.map(t => <option key={t} value={t === '全部' ? '' : t}>{t}</option>)}
          </select>
        </div>
        <div className="card table-card">
          {loading ? <Spinner /> : err ? (
            <div className="error-box" style={{ margin: 16 }}>
              ⚠ {err}
              <button className="btn btn-outline" style={{ marginLeft: 12 }} onClick={loadLogs}>重试</button>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>时间</th>
                  <th>类型</th>
                  <th>操作目标</th>
                  <th>操作人</th>
                  <th>扣次</th>
                  <th>状态</th>
                </tr>
              </thead>
              <tbody>
                {logs.map(log => (
                  <tr key={log.id}>
                    <td className="cell-sub">{formatDate(log.createdAt)}</td>
                    <td><TypeBadge type={log.type} /></td>
                    <td className="cell-main">{log.target}</td>
                    <td>{log.userName}</td>
                    <td><span className="cost-badge">-{log.cost}次</span></td>
                    <td><StatusBadge status={log.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {!loading && !err && logs.length === 0 && (
            <div className="empty-state">没有匹配的调用记录</div>
          )}
        </div>
        {totalPages > 1 && (
          <div className="pagination">
            <button className="page-btn" disabled={page === 1} onClick={() => setPage(p => p - 1)}>上一页</button>
            <span className="page-info">{page} / {totalPages}</span>
            <button className="page-btn" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>下一页</button>
          </div>
        )}
      </div>

      {summary && summary.byEmployee.length > 0 && (
        <div className="section">
          <div className="section-header">
            <h2 className="section-title">员工用量统计（本月）</h2>
          </div>
          <div className="card">
            <div className="employee-usage">
              {summary.byEmployee.map(e => (
                <div key={e.name} className="employee-row">
                  <div className="employee-name">{e.name}</div>
                  <div className="usage-bar-wrap">
                    <div className="usage-bar">
                      <div
                        className="usage-fill"
                        style={{
                          width: `${Math.min((e.count / (e.quota || 1)) * 100, 100)}%`,
                          background: e.count / (e.quota || 1) > 0.7 ? '#d97706' : '#2563eb',
                        }}
                      />
                    </div>
                  </div>
                  <div className="usage-count">{e.count}/{e.quota}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
