import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  getDashboardStats,
  ApiCustomer, ApiReportTask,
} from '../../utils/api'
import './Dashboard.css'

function Spinner() {
  return <div className="spinner-wrap"><div className="spinner" /></div>
}

const STATUS_STAGE: Record<string, string> = {
  COLLECTING: '资料收集',
  REVIEWING:  '顾问复核',
  REPORTING:  '银行对接',
  SUBMITTED:  '下户',
  DONE:       '完成',
  PAUSED:     '暂停',
}

const TASK_STATUS_LABEL: Record<string, string> = {
  PENDING:    '待AI填写',
  PROCESSING: '处理中',
  DONE:       '待审查',
  EXPORTED:   '已导出',
  FAILED:     '失败',
}

const flowSteps = [
  '看客户卡点',
  '确认资料识别',
  '选择银行产品',
  'AI填表审查',
  '处理问题并导出',
]

function derivePriority(c: ApiCustomer): string {
  const p = c.labels?.find(l => /^P[0-3]$/.test(l))
  if (p) return p
  if (c.docCompleteness < 50) return 'P0'
  if (c.docCompleteness < 70) return 'P1'
  if (c.docCompleteness < 90) return 'P2'
  return 'P3'
}

function PriorityBadge({ priority }: { priority: string }) {
  const colors: Record<string, { bg: string; text: string }> = {
    P0: { bg: '#fef2f2', text: '#dc2626' },
    P1: { bg: '#fffbeb', text: '#d97706' },
    P2: { bg: '#eff6ff', text: '#2563eb' },
    P3: { bg: '#f8fafc', text: '#64748b' },
  }
  const c = colors[priority] ?? colors['P3']
  return <span className="badge" style={{ background: c.bg, color: c.text }}>{priority}</span>
}

function StageBadge({ stage }: { stage: string }) {
  const stageColors: Record<string, { bg: string; text: string }> = {
    '资料收集': { bg: '#f0fdf4', text: '#16a34a' },
    '顾问复核': { bg: '#eff6ff', text: '#2563eb' },
    '银行对接': { bg: '#fffbeb', text: '#d97706' },
    '下户':     { bg: '#fdf4ff', text: '#9333ea' },
    '完成':     { bg: '#f8fafc', text: '#64748b' },
    '暂停':     { bg: '#f8fafc', text: '#94a3b8' },
  }
  const c = stageColors[stage] ?? { bg: '#f8fafc', text: '#64748b' }
  return <span className="badge" style={{ background: c.bg, color: c.text }}>{stage}</span>
}

function FillStatusBadge({ status }: { status: string }) {
  const label = TASK_STATUS_LABEL[status] ?? status
  const map: Record<string, { bg: string; text: string }> = {
    '待AI填写': { bg: '#eff6ff', text: '#2563eb' },
    '处理中':   { bg: '#fdf4ff', text: '#9333ea' },
    '待审查':   { bg: '#fffbeb', text: '#d97706' },
    '已导出':   { bg: '#f8fafc', text: '#64748b' },
    '失败':     { bg: '#fef2f2', text: '#dc2626' },
  }
  const c = map[label] ?? { bg: '#f8fafc', text: '#64748b' }
  return <span className="badge" style={{ background: c.bg, color: c.text }}>{label}</span>
}

function todayString() {
  const d = new Date()
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 · 今日`
}

export default function Dashboard() {
  const navigate = useNavigate()
  const [customers, setCustomers] = useState<ApiCustomer[]>([])
  const [tasks, setTasks] = useState<ApiReportTask[]>([])
  const [taskTotal, setTaskTotal] = useState(0)
  const [aiPending, setAiPending] = useState(0)
  const [reportQuota, setReportQuota] = useState(-1)
  const [reportUsed, setReportUsed] = useState(0)
  const [docGapCount, setDocGapCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setErr('')
    try {
      const stats = await getDashboardStats()
      setCustomers(stats.todayCustomers)
      setTasks(stats.recentTasks)
      setTaskTotal(stats.taskTotal)
      setAiPending(stats.aiPending)
      setDocGapCount(stats.docGapCount)
      setReportQuota(stats.reportQuota)
      setReportUsed(stats.reportUsed)
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : '加载失败')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const remainingQuota = reportQuota === -1 ? '∞' : reportQuota - reportUsed

  const metrics = [
    { label: '资料缺口客户',   value: docGapCount,      unit: '个', color: '#dc2626', bg: '#fef2f2', desc: '需要补充材料' },
    { label: '今日待处理作业', value: taskTotal,         unit: '条', color: '#d97706', bg: '#fffbeb', desc: '填表 / 复核 / 导出' },
    { label: 'AI审查待处理',   value: aiPending,         unit: '项', color: '#2563eb', bg: '#eff6ff', desc: '等待顾问确认' },
    { label: '剩余调用次数',   value: remainingQuota,    unit: typeof remainingQuota === 'number' ? '次' : '', color: '#16a34a', bg: '#f0fdf4', desc: '机构版额度' },
  ]

  // Derive todos from customer riskNotes
  const todos = customers
    .filter(c => c.riskNotes)
    .slice(0, 4)
    .map(c => ({
      id:    c.id,
      level: c.docCompleteness < 50 ? 'error' as const : c.docCompleteness < 80 ? 'warn' as const : 'info' as const,
      text:  `${c.name} — ${c.riskNotes}`,
      tag:   c.docCompleteness < 70 ? 'P0' : 'P1',
    }))

  return (
    <div className="dashboard">
      <div className="page-header">
        <h1 className="page-title">工作台</h1>
        <span className="page-date">{todayString()}</span>
      </div>

      {loading ? <Spinner /> : err ? (
        <div className="dash-error">⚠ {err} <button className="btn-link" style={{ marginLeft: 8 }} onClick={load}>重试</button></div>
      ) : (
        <>
          {/* Metrics */}
          <div className="metrics-grid">
            {metrics.map((m) => (
              <div key={m.label} className="metric-card" style={{ borderTop: `3px solid ${m.color}`, background: m.bg }}>
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
              {customers.length === 0 ? (
                <div className="dash-empty">暂无客户数据</div>
              ) : (
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
                    {customers.map((c) => (
                      <tr key={c.id} className="table-row-hover" onClick={() => navigate(`/customers/${c.id}`)}>
                        <td><PriorityBadge priority={derivePriority(c)} /></td>
                        <td>
                          <div className="cell-main">{c.name}</div>
                          {c.loanAmount != null && (
                            <div className="cell-sub">融资需求 {c.loanAmount} 万</div>
                          )}
                        </td>
                        <td><StageBadge stage={STATUS_STAGE[c.status] ?? c.status} /></td>
                        <td>
                          <div className="progress-wrap">
                            <div className="progress-bar">
                              <div className="progress-fill" style={{ width: `${c.docCompleteness}%` }} />
                            </div>
                            <span className="progress-label">{c.docCompleteness}%</span>
                          </div>
                        </td>
                        <td>
                          <span className="block-text">{c.riskNotes || '—'}</span>
                        </td>
                        <td><span className="advisor-tag">{c.advisorName ?? '—'}</span></td>
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
              )}
            </div>

            {/* Right column */}
            <div className="dashboard-right">
              {/* Todos */}
              <div className="card todo-card">
                <div className="card-header-row">
                  <h2 className="card-title">当前关键待办</h2>
                  {todos.length > 0 && <span className="badge badge-count">{todos.length}</span>}
                </div>
                {todos.length === 0 ? (
                  <div className="dash-empty" style={{ fontSize: 13 }}>暂无风险待办</div>
                ) : (
                  <div className="todo-list">
                    {todos.map((todo) => (
                      <div key={todo.id} className={`todo-item todo-${todo.level}`}>
                        <div className="todo-dot" />
                        <div className="todo-text">{todo.text}</div>
                        <PriorityBadge priority={todo.tag} />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Fill tasks */}
              <div className="card">
                <div className="card-header-row">
                  <h2 className="card-title">今日AI填表任务</h2>
                  <button className="btn-link" onClick={() => navigate('/reports')}>查看全部 ›</button>
                </div>
                {tasks.length === 0 ? (
                  <div className="dash-empty" style={{ fontSize: 13 }}>暂无进行中任务</div>
                ) : (
                  <div className="fill-task-list">
                    {tasks.map((task) => (
                      <div
                        key={task.id}
                        className="fill-task-item"
                        onClick={() => navigate(`/reports/${task.id}`)}
                      >
                        <div className="fill-task-top">
                          <span className="fill-task-name">{task.customer_name}</span>
                          <FillStatusBadge status={task.status} />
                        </div>
                        <div className="fill-task-meta">{task.bank_short_name} · {task.product_name}</div>
                        <div className="fill-task-time">{task.updated_at?.slice(0, 10) ?? '—'}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
