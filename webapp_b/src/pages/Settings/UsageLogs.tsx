import { useState } from 'react'
import { mockUsageLogs } from '../../utils/mock'
import './Settings.css'

function TypeBadge({ type }: { type: string }) {
  const map: Record<string, { bg: string; text: string }> = {
    '报告生成': { bg: '#eff6ff', text: '#2563eb' },
    '材料整理': { bg: '#f0fdf4', text: '#16a34a' },
    'API调用': { bg: '#fdf4ff', text: '#9333ea' },
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

const employeeUsage = [
  { name: '张顾问', count: 28, max: 50 },
  { name: '李顾问', count: 14, max: 50 },
  { name: '王顾问', count: 11, max: 50 },
]

export default function UsageLogs() {
  const [typeFilter, setTypeFilter] = useState('全部')
  const [search, setSearch] = useState('')

  const metrics = [
    { label: '本月总调用', value: 53, color: '#0f172a', bg: '#f8fafc' },
    { label: '报告生成', value: 38, color: '#2563eb', bg: '#eff6ff' },
    { label: '材料整理', value: 11, color: '#16a34a', bg: '#f0fdf4' },
    { label: 'API调用', value: 4, color: '#9333ea', bg: '#fdf4ff' },
  ]

  const types = ['全部', '报告生成', '材料整理', 'API调用']

  const filtered = mockUsageLogs.filter((log) => {
    const matchType = typeFilter === '全部' || log.type === typeFilter
    const matchSearch = !search || log.target.includes(search) || log.user.includes(search)
    return matchType && matchSearch
  })

  return (
    <div className="settings-page">
      <div className="page-header">
        <h1 className="page-title">调用记录</h1>
        <button className="btn btn-outline">↓ 导出记录</button>
      </div>

      <div className="metrics-grid-4">
        {metrics.map((m) => (
          <div key={m.label} className="metric-card" style={{ borderTop: `3px solid ${m.color}`, background: m.bg }}>
            <div className="metric-value" style={{ color: m.color }}>{m.value}</div>
            <div className="metric-label">{m.label}</div>
            <div className="metric-desc">2026年6月</div>
          </div>
        ))}
      </div>

      <div className="section">
        <div className="section-header">
          <h2 className="section-title">调用明细</h2>
        </div>
        <div className="card" style={{ padding: '12px 16px', marginBottom: 12 }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <input
              className="search-input"
              placeholder="搜索目标客户或用户..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ flex: 1, height: 34, border: '1px solid #e2e8f0', borderRadius: 6, padding: '0 12px', fontSize: 13, outline: 'none' }}
            />
            <select
              style={{ height: 34, border: '1px solid #e2e8f0', borderRadius: 6, padding: '0 10px', fontSize: 13, background: 'white', outline: 'none' }}
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              {types.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>
        <div className="card table-card">
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
              {filtered.map((log) => (
                <tr key={log.id}>
                  <td className="cell-sub">{log.time}</td>
                  <td><TypeBadge type={log.type} /></td>
                  <td className="cell-main">{log.target}</td>
                  <td>{log.user}</td>
                  <td>
                    <span className="cost-badge">-{log.cost}次</span>
                  </td>
                  <td><StatusBadge status={log.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>没有匹配的记录</div>
          )}
        </div>
      </div>

      <div className="section">
        <div className="section-header">
          <h2 className="section-title">员工用量统计（本月）</h2>
        </div>
        <div className="card">
          <div className="employee-usage">
            {employeeUsage.map((e) => (
              <div key={e.name} className="employee-row">
                <div className="employee-name">{e.name}</div>
                <div className="usage-bar-wrap">
                  <div className="usage-bar">
                    <div
                      className="usage-fill"
                      style={{
                        width: `${(e.count / e.max) * 100}%`,
                        background: e.count / e.max > 0.7 ? '#d97706' : '#2563eb'
                      }}
                    />
                  </div>
                </div>
                <div className="usage-count">{e.count}/{e.max}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
