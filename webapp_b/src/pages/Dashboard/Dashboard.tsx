import { useNavigate } from 'react-router-dom'
import { mockCustomers, mockFillTasks } from '../../utils/mock'
import './Dashboard.css'

const metrics = [
  { label: '资料缺口客户', value: 2, unit: '个', color: '#dc2626', bg: '#fef2f2', desc: '需要补充材料' },
  { label: '今日待处理作业', value: 4, unit: '条', color: '#d97706', bg: '#fffbeb', desc: '填表 / 复核 / 导出' },
  { label: 'AI审查待处理', value: 3, unit: '项', color: '#2563eb', bg: '#eff6ff', desc: '等待顾问确认' },
  { label: '剩余调用次数', value: 247, unit: '次', color: '#16a34a', bg: '#f0fdf4', desc: '机构版额度' },
]

const flowSteps = [
  '看客户卡点',
  '确认资料识别',
  '选择银行产品',
  'AI填表审查',
  '处理问题并导出',
]

const todos = [
  { id: 1, level: 'error', text: '苏州盛晨科技 — 近12个月对公流水未上传，阻塞银行对接', tag: 'P0' },
  { id: 2, level: 'warn', text: '南京鸿达贸易 — 法人征信查询次数说明待收集', tag: 'P1' },
  { id: 3, level: 'warn', text: 'AI填表任务：杭州云帆数字贷 — 待触发AI填写', tag: 'P1' },
  { id: 4, level: 'info', text: '无锡华荣建材 — 资料包已完整，可导出交付', tag: 'P0' },
]

function PriorityBadge({ priority }: { priority: string }) {
  const colors: Record<string, { bg: string; text: string }> = {
    P0: { bg: '#fef2f2', text: '#dc2626' },
    P1: { bg: '#fffbeb', text: '#d97706' },
    P2: { bg: '#eff6ff', text: '#2563eb' },
    P3: { bg: '#f8fafc', text: '#64748b' },
  }
  const c = colors[priority] || colors['P3']
  return (
    <span className="badge" style={{ background: c.bg, color: c.text }}>
      {priority}
    </span>
  )
}

function StageBadge({ stage }: { stage: string }) {
  const stageColors: Record<string, { bg: string; text: string }> = {
    '资料收集': { bg: '#f0fdf4', text: '#16a34a' },
    '顾问复核': { bg: '#eff6ff', text: '#2563eb' },
    '银行对接': { bg: '#fffbeb', text: '#d97706' },
    '下户': { bg: '#fdf4ff', text: '#9333ea' },
  }
  const c = stageColors[stage] || { bg: '#f8fafc', text: '#64748b' }
  return (
    <span className="badge" style={{ background: c.bg, color: c.text }}>
      {stage}
    </span>
  )
}

function FillStatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; text: string }> = {
    '待AI填写': { bg: '#eff6ff', text: '#2563eb' },
    '待处理': { bg: '#fffbeb', text: '#d97706' },
    '可导出': { bg: '#f0fdf4', text: '#16a34a' },
    '已导出': { bg: '#f8fafc', text: '#64748b' },
  }
  const c = map[status] || { bg: '#f8fafc', text: '#64748b' }
  return <span className="badge" style={{ background: c.bg, color: c.text }}>{status}</span>
}

export default function Dashboard() {
  const navigate = useNavigate()

  return (
    <div className="dashboard">
      <div className="page-header">
        <h1 className="page-title">工作台</h1>
        <span className="page-date">2026年6月17日 · 今日</span>
      </div>

      {/* Metrics */}
      <div className="metrics-grid">
        {metrics.map((m) => (
          <div key={m.label} className="metric-card" style={{ borderTop: `3px solid ${m.color}` }}>
            <div className="metric-value" style={{ color: m.color }}>{m.value}</div>
            <div className="metric-unit">{m.unit}</div>
            <div className="metric-label">{m.label}</div>
            <div className="metric-desc">{m.desc}</div>
          </div>
        ))}
      </div>

      {/* Flow indicator */}
      <div className="card flow-card">
        <div className="card-header-row">
          <h2 className="card-title">作业流程导航</h2>
          <span className="card-subtitle">当前推荐操作顺序</span>
        </div>
        <div className="flow-steps">
          {flowSteps.map((step, i) => (
            <div key={step} className="flow-step-wrap">
              <div className={`flow-step ${i === 0 ? 'flow-step-active' : ''}`}>
                <div className="flow-step-num">{i + 1}</div>
                <div className="flow-step-label">{step}</div>
              </div>
              {i < flowSteps.length - 1 && <div className="flow-arrow">›</div>}
            </div>
          ))}
        </div>
      </div>

      <div className="dashboard-grid">
        {/* Customer table */}
        <div className="card dashboard-table-card">
          <div className="card-header-row">
            <h2 className="card-title">今日客户作业</h2>
            <button className="btn-link" onClick={() => navigate('/customers')}>查看全部 ›</button>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>优先级</th>
                <th>客户名称</th>
                <th>阶段</th>
                <th>完整度</th>
                <th>当前卡点</th>
                <th>顾问</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {mockCustomers.map((c) => (
                <tr key={c.id} className="table-row-hover" onClick={() => navigate(`/customers/${c.id}`)}>
                  <td><PriorityBadge priority={c.priority} /></td>
                  <td>
                    <div className="cell-main">{c.name}</div>
                    <div className="cell-sub">{c.industry} · {c.owner}</div>
                  </td>
                  <td><StageBadge stage={c.stage} /></td>
                  <td>
                    <div className="progress-wrap">
                      <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${c.complete}%` }} />
                      </div>
                      <span className="progress-label">{c.complete}%</span>
                    </div>
                  </td>
                  <td>
                    <span className="block-text">{c.block === '无' ? '—' : c.block}</span>
                  </td>
                  <td><span className="advisor-tag">{c.advisor}</span></td>
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
        </div>

        {/* Right column */}
        <div className="dashboard-right">
          {/* Todos */}
          <div className="card todo-card">
            <div className="card-header-row">
              <h2 className="card-title">当前关键待办</h2>
              <span className="badge badge-count">{todos.length}</span>
            </div>
            <div className="todo-list">
              {todos.map((todo) => (
                <div key={todo.id} className={`todo-item todo-${todo.level}`}>
                  <div className="todo-dot" />
                  <div className="todo-text">{todo.text}</div>
                  <PriorityBadge priority={todo.tag} />
                </div>
              ))}
            </div>
          </div>

          {/* Fill tasks */}
          <div className="card">
            <div className="card-header-row">
              <h2 className="card-title">今日AI填表任务</h2>
              <button className="btn-link" onClick={() => navigate('/reports')}>查看全部 ›</button>
            </div>
            <div className="fill-task-list">
              {mockFillTasks.slice(0, 3).map((task) => (
                <div
                  key={task.id}
                  className="fill-task-item"
                  onClick={() => navigate(`/reports/${task.id}`)}
                >
                  <div className="fill-task-top">
                    <span className="fill-task-name">{task.customerName}</span>
                    <FillStatusBadge status={task.status} />
                  </div>
                  <div className="fill-task-meta">{task.bankName} · {task.product}</div>
                  <div className="fill-task-progress">
                    <div className="progress-bar">
                      <div
                        className="progress-fill"
                        style={{ width: `${task.totalFields > 0 ? (task.filledFields / task.totalFields) * 100 : 0}%` }}
                      />
                    </div>
                    <span className="progress-label">{task.filledFields}/{task.totalFields} 字段</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
