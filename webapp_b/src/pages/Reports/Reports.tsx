import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { mockFillTasks } from '../../utils/mock'
import './Reports.css'

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; text: string }> = {
    '待AI填写': { bg: '#eff6ff', text: '#2563eb' },
    '待处理': { bg: '#fffbeb', text: '#d97706' },
    '可导出': { bg: '#f0fdf4', text: '#16a34a' },
    '已导出': { bg: '#f8fafc', text: '#64748b' },
  }
  const c = map[status] || { bg: '#f8fafc', text: '#64748b' }
  return <span className="badge" style={{ background: c.bg, color: c.text }}>{status}</span>
}

export default function Reports() {
  const navigate = useNavigate()
  const [statusFilter, setStatusFilter] = useState('全部')
  const [productFilter, setProductFilter] = useState('全部')
  const [search, setSearch] = useState('')

  const metrics = [
    { label: '待AI填写', value: 2, color: '#2563eb', bg: '#eff6ff' },
    { label: '待处理', value: 1, color: '#d97706', bg: '#fffbeb' },
    { label: '可导出', value: 1, color: '#16a34a', bg: '#f0fdf4' },
  ]

  const statuses = ['全部', '待AI填写', '待处理', '可导出', '已导出']
  const products = ['全部', '科创贷', '数字贷', '生意贷', '经营快贷']

  const filtered = mockFillTasks.filter((t) => {
    const matchSearch = !search || t.customerName.includes(search)
    const matchStatus = statusFilter === '全部' || t.status === statusFilter
    const matchProduct = productFilter === '全部' || t.product === productFilter
    return matchSearch && matchStatus && matchProduct
  })

  function getActionBtn(task: typeof mockFillTasks[0]) {
    if (task.status === '待AI填写') return { label: '触发AI填写', cls: 'btn-ai' }
    if (task.status === '待处理') return { label: '开始复核', cls: 'btn-review' }
    if (task.status === '可导出') return { label: '导出材料包', cls: 'btn-export' }
    return { label: '查看', cls: 'btn-view' }
  }

  return (
    <div className="reports-page">
      <div className="page-header">
        <h1 className="page-title">报告作业台</h1>
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
        <input
          className="search-input"
          placeholder="搜索客户名称..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select className="filter-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select className="filter-select" value={productFilter} onChange={(e) => setProductFilter(e.target.value)}>
          {products.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>

      <div className="card table-card">
        <table className="data-table">
          <thead>
            <tr>
              <th>客户名称</th>
              <th>目标银行</th>
              <th>产品</th>
              <th>AI填写进度</th>
              <th>状态</th>
              <th>处理人</th>
              <th>更新时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((task) => {
              const action = getActionBtn(task)
              const pct = task.totalFields > 0 ? Math.round((task.filledFields / task.totalFields) * 100) : 0
              return (
                <tr
                  key={task.id}
                  className="table-row-hover"
                  onClick={() => navigate(`/reports/${task.id}`)}
                >
                  <td>
                    <div className="cell-main">{task.customerName}</div>
                    <div className="cell-sub">{task.industry} · {task.complete}% 完整</div>
                  </td>
                  <td>{task.bankName}</td>
                  <td><span className="product-tag">{task.product}</span></td>
                  <td>
                    <div className="progress-wrap">
                      <div className="progress-bar">
                        <div
                          className="progress-fill"
                          style={{
                            width: `${pct}%`,
                            background: pct === 100 ? '#16a34a' : '#2563eb'
                          }}
                        />
                      </div>
                      <span className="progress-label">{task.filledFields}/{task.totalFields}</span>
                    </div>
                  </td>
                  <td><StatusBadge status={task.status} /></td>
                  <td>{task.reviewer}</td>
                  <td className="cell-sub">{task.time}</td>
                  <td>
                    <button
                      className={`btn-sm ${action.cls}`}
                      onClick={(e) => { e.stopPropagation(); navigate(`/reports/${task.id}`) }}
                    >
                      {action.label}
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="empty-state">没有匹配的作业任务</div>
        )}
      </div>
    </div>
  )
}
