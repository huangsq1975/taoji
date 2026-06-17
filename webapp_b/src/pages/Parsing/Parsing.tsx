import { useState } from 'react'
import { mockParseFiles } from '../../utils/mock'
import './Parsing.css'

function ConfBadge({ conf }: { conf: number }) {
  if (conf >= 90) return <span className="badge badge-high">{conf}%</span>
  if (conf >= 75) return <span className="badge badge-mid">{conf}%</span>
  return <span className="badge badge-low">{conf}%</span>
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; text: string }> = {
    '已确认': { bg: '#f0fdf4', text: '#16a34a' },
    '待确认': { bg: '#fffbeb', text: '#d97706' },
    '识别失败': { bg: '#fef2f2', text: '#dc2626' },
  }
  const c = map[status] || { bg: '#f8fafc', text: '#64748b' }
  return <span className="badge" style={{ background: c.bg, color: c.text }}>{status}</span>
}

export default function Parsing() {
  const [statusFilter, setStatusFilter] = useState('全部')
  const [customerFilter, setCustomerFilter] = useState('全部')

  const metrics = [
    { label: '今日上传', value: 5, color: '#2563eb', bg: '#eff6ff' },
    { label: 'AI已识别', value: 3, color: '#16a34a', bg: '#f0fdf4' },
    { label: '待顾问确认', value: 2, color: '#d97706', bg: '#fffbeb' },
    { label: '识别失败', value: 1, color: '#dc2626', bg: '#fef2f2' },
  ]

  const statuses = ['全部', '已确认', '待确认', '识别失败']
  const customers = ['全部', '苏州盛晨科技有限公司', '南京鸿达贸易有限公司', '杭州云帆网络科技有限公司']

  const filtered = mockParseFiles.filter((f) => {
    const matchStatus = statusFilter === '全部' || f.status === statusFilter
    const matchCust = customerFilter === '全部' || f.customer === customerFilter
    return matchStatus && matchCust
  })

  return (
    <div className="parsing-page">
      <div className="page-header">
        <h1 className="page-title">AI资料识别</h1>
        <div className="header-actions">
          <button className="btn btn-primary">↑ 上传文件</button>
          <button className="btn btn-outline">✓ 批量确认</button>
        </div>
      </div>

      <div className="metrics-row">
        {metrics.map((m) => (
          <div key={m.label} className="metric-mini-card" style={{ borderLeft: `4px solid ${m.color}`, background: m.bg }}>
            <div className="metric-mini-value" style={{ color: m.color }}>{m.value}</div>
            <div className="metric-mini-label">{m.label}</div>
          </div>
        ))}
      </div>

      <div className="card toolbar">
        <select className="filter-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select className="filter-select" value={customerFilter} onChange={(e) => setCustomerFilter(e.target.value)}>
          {customers.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <div className="toolbar-spacer" />
        <span className="file-count">共 {filtered.length} 个文件</span>
      </div>

      <div className="card table-card">
        <table className="data-table">
          <thead>
            <tr>
              <th>文件名</th>
              <th>上传人</th>
              <th>归属客户</th>
              <th>AI识别类型</th>
              <th>置信度</th>
              <th>状态</th>
              <th>上传时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((f) => (
              <tr key={f.id} className="table-row">
                <td>
                  <div className="file-name-cell">
                    <span className="file-icon">{f.filename.endsWith('.pdf') ? '📄' : '🖼️'}</span>
                    <span className="cell-main">{f.filename}</span>
                  </div>
                </td>
                <td className="cell-sub">{f.uploader}</td>
                <td>{f.customer}</td>
                <td>
                  <span className={`ai-type-tag ${f.aiType === '未知' ? 'type-unknown' : 'type-known'}`}>
                    {f.aiType}
                  </span>
                </td>
                <td><ConfBadge conf={f.confidence} /></td>
                <td><StatusBadge status={f.status} /></td>
                <td className="cell-sub">{f.time}</td>
                <td>
                  <div className="action-btns">
                    {f.status === '待确认' && (
                      <>
                        <button className="btn-sm btn-confirm">确认</button>
                        <button className="btn-sm btn-edit">修正</button>
                      </>
                    )}
                    {f.status === '已确认' && (
                      <button className="btn-sm btn-view">查看</button>
                    )}
                    {f.status === '识别失败' && (
                      <button className="btn-sm btn-retry">重新识别</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="empty-state">没有匹配的文件记录</div>
        )}
      </div>
    </div>
  )
}
