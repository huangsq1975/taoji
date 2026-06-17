import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { mockCustomers } from '../../utils/mock'
import type { Customer } from '../../types'
import './Customers.css'

function PriorityBadge({ priority }: { priority: string }) {
  const map: Record<string, { bg: string; text: string }> = {
    P0: { bg: '#fef2f2', text: '#dc2626' },
    P1: { bg: '#fffbeb', text: '#d97706' },
    P2: { bg: '#eff6ff', text: '#2563eb' },
    P3: { bg: '#f8fafc', text: '#64748b' },
  }
  const c = map[priority] || map['P3']
  return <span className="badge" style={{ background: c.bg, color: c.text }}>{priority}</span>
}

function StageBadge({ stage }: { stage: string }) {
  const map: Record<string, { bg: string; text: string }> = {
    '资料收集': { bg: '#f0fdf4', text: '#16a34a' },
    '顾问复核': { bg: '#eff6ff', text: '#2563eb' },
    '银行对接': { bg: '#fffbeb', text: '#d97706' },
    '下户': { bg: '#fdf4ff', text: '#9333ea' },
  }
  const c = map[stage] || { bg: '#f8fafc', text: '#64748b' }
  return <span className="badge" style={{ background: c.bg, color: c.text }}>{stage}</span>
}

function RiskBadge({ risk }: { risk: string }) {
  const map: Record<string, { bg: string; text: string }> = {
    '低': { bg: '#f0fdf4', text: '#16a34a' },
    '中': { bg: '#fffbeb', text: '#d97706' },
    '高': { bg: '#fef2f2', text: '#dc2626' },
  }
  const c = map[risk] || { bg: '#f8fafc', text: '#64748b' }
  return <span className="badge" style={{ background: c.bg, color: c.text }}>风险 {risk}</span>
}

export default function Customers() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [stageFilter, setStageFilter] = useState('全部')
  const [sortKey, setSortKey] = useState<keyof Customer | ''>('')

  const stages = ['全部', '资料收集', '顾问复核', '银行对接', '下户']
  const sortOptions: { key: keyof Customer; label: string }[] = [
    { key: 'priority', label: '按优先级' },
    { key: 'complete', label: '按完整度' },
    { key: 'stage', label: '按阶段' },
    { key: 'advisor', label: '按顾问' },
  ]

  const filtered = mockCustomers
    .filter((c) => {
      const matchSearch = !search || c.name.includes(search) || c.owner.includes(search) || c.industry.includes(search)
      const matchStage = stageFilter === '全部' || c.stage === stageFilter
      return matchSearch && matchStage
    })
    .sort((a, b) => {
      if (!sortKey) return 0
      const av = a[sortKey] as string | number
      const bv = b[sortKey] as string | number
      if (typeof av === 'number' && typeof bv === 'number') return bv - av
      return String(av).localeCompare(String(bv))
    })

  return (
    <div className="customers-page">
      <div className="page-header">
        <h1 className="page-title">客户列表</h1>
        <button className="btn btn-primary">+ 新增客户</button>
      </div>

      <div className="toolbar card">
        <input
          className="search-input"
          placeholder="搜索客户名称、法人、行业..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="filter-select"
          value={stageFilter}
          onChange={(e) => setStageFilter(e.target.value)}
        >
          {stages.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <div className="sort-buttons">
          {sortOptions.map((opt) => (
            <button
              key={opt.key}
              className={`sort-btn ${sortKey === opt.key ? 'sort-btn-active' : ''}`}
              onClick={() => setSortKey(sortKey === opt.key ? '' : opt.key)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="card table-card">
        <table className="data-table">
          <thead>
            <tr>
              <th>优先级</th>
              <th>客户名称</th>
              <th>资质标签</th>
              <th>阶段</th>
              <th>需求金额</th>
              <th>资料完整度</th>
              <th>当前卡点</th>
              <th>顾问</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => (
              <tr
                key={c.id}
                className="table-row-hover"
                onClick={() => navigate(`/customers/${c.id}`)}
              >
                <td><PriorityBadge priority={c.priority} /></td>
                <td>
                  <div className="cell-main">{c.name}</div>
                  <div className="cell-sub">{c.industry} · {c.owner} · 成立{c.years}年</div>
                </td>
                <td>
                  <div className="qual-tags">
                    {c.qual.map((q) => (
                      <span key={q} className="qual-tag">{q}</span>
                    ))}
                    <RiskBadge risk={c.risk} />
                  </div>
                </td>
                <td><StageBadge stage={c.stage} /></td>
                <td>
                  <span className="amount-text">{c.amount}</span>
                  <div className="cell-sub">{c.bank} · {c.product}</div>
                </td>
                <td>
                  <div className="progress-wrap">
                    <div className="progress-bar">
                      <div
                        className="progress-fill"
                        style={{ width: `${c.complete}%`, background: c.complete >= 80 ? '#16a34a' : c.complete >= 60 ? '#d97706' : '#dc2626' }}
                      />
                    </div>
                    <span className="progress-label">{c.complete}%</span>
                  </div>
                </td>
                <td>
                  <span className="block-text">{c.block === '无' ? <span className="text-green">—</span> : c.block}</span>
                </td>
                <td>
                  <span className="advisor-chip">{c.advisor}</span>
                  <div className="cell-sub">{c.last}</div>
                </td>
                <td>
                  <button
                    className="btn-sm btn-primary"
                    onClick={(e) => { e.stopPropagation(); navigate('/reports') }}
                  >
                    AI填表
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="empty-state">没有找到匹配的客户</div>
        )}
      </div>
    </div>
  )
}
