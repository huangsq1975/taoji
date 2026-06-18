import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  listReportTasks,
  createReportTask,
  listCustomers,
  listBankProducts,
  ApiReportTask,
  ApiProduct,
} from '../../utils/api'
import './Reports.css'

const STATUS_MAP: Record<string, { label: string; bg: string; text: string }> = {
  PENDING:     { label: '待AI填写',  bg: '#eff6ff', text: '#2563eb' },
  AI_FILLING:  { label: 'AI填写中',  bg: '#f0f9ff', text: '#0284c7' },
  AI_DONE:     { label: '待复核',    bg: '#fffbeb', text: '#d97706' },
  REVIEWING:   { label: '复核中',    bg: '#fff7ed', text: '#ea580c' },
  REVIEW_DONE: { label: '待导出',    bg: '#f0fdf4', text: '#16a34a' },
  EXPORTING:   { label: '导出中',    bg: '#f0fdf4', text: '#15803d' },
  EXPORTED:    { label: '已导出',    bg: '#f8fafc', text: '#64748b' },
  SUBMITTED:   { label: '已提交',    bg: '#fdf4ff', text: '#9333ea' },
}

function statusInfo(status: string) {
  return STATUS_MAP[status] || { label: status, bg: '#f8fafc', text: '#64748b' }
}

function StatusBadge({ status }: { status: string }) {
  const c = statusInfo(status)
  return <span className="badge" style={{ background: c.bg, color: c.text }}>{c.label}</span>
}

function formatDate(iso: string) {
  const d = new Date(iso)
  const now = Date.now()
  const diff = now - d.getTime()
  if (diff < 60_000) return '刚刚'
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}分钟前`
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}小时前`
  if (diff < 7 * 86_400_000) return `${Math.floor(diff / 86_400_000)}天前`
  return d.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' })
}

const STATUS_OPTIONS = [
  { value: '', label: '全部状态' },
  { value: 'PENDING', label: '待AI填写' },
  { value: 'AI_DONE', label: '待复核' },
  { value: 'REVIEW_DONE', label: '待导出' },
  { value: 'EXPORTED', label: '已导出' },
  { value: 'SUBMITTED', label: '已提交' },
]

interface CreateModalProps {
  onClose: () => void
  onCreated: (task: ApiReportTask) => void
}

function CreateTaskModal({ onClose, onCreated }: CreateModalProps) {
  const [customers, setCustomers] = useState<{ id: number; name: string }[]>([])
  const [products, setProducts] = useState<ApiProduct[]>([])
  const [customerId, setCustomerId] = useState('')
  const [productId, setProductId] = useState('')
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')

  useEffect(() => {
    listCustomers({ pageSize: 100 }).then(r => setCustomers(r.items.map(c => ({ id: c.id, name: c.name }))))
    listBankProducts().then(setProducts)
  }, [])

  async function handleSubmit() {
    if (!customerId || !productId) { setErr('请选择客户和产品'); return }
    setLoading(true)
    setErr('')
    try {
      const task = await createReportTask({ customerId: Number(customerId), productId: Number(productId) })
      onCreated(task)
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : '创建失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-mask" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">新建报告任务</span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="form-field">
            <label className="form-label">客户<span className="required">*</span></label>
            <select className="form-select" value={customerId} onChange={e => setCustomerId(e.target.value)}>
              <option value="">请选择客户</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="form-field">
            <label className="form-label">银行产品<span className="required">*</span></label>
            <select className="form-select" value={productId} onChange={e => setProductId(e.target.value)}>
              <option value="">请选择产品</option>
              {products.map(p => <option key={p.id} value={p.id}>{p.bankName} · {p.name}</option>)}
            </select>
          </div>
          {err && <div className="form-error">{err}</div>}
        </div>
        <div className="modal-footer">
          <button className="btn btn-outline" onClick={onClose}>取消</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
            {loading ? '创建中...' : '创建任务'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Reports() {
  const navigate = useNavigate()
  const [tasks, setTasks] = useState<ApiReportTask[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const pageSize = 20
  const [loading, setLoading] = useState(false)
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [showCreate, setShowCreate] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400)
    return () => clearTimeout(t)
  }, [search])

  useEffect(() => { setPage(1) }, [debouncedSearch, statusFilter])

  const fetchTasks = useCallback(async () => {
    setLoading(true)
    try {
      const res = await listReportTasks({ status: statusFilter || undefined, page, pageSize })
      setTasks(res.items)
      setTotal(res.total)
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [statusFilter, page, pageSize])

  useEffect(() => { fetchTasks() }, [fetchTasks])

  const totalPages = Math.ceil(total / pageSize)

  // Derive metrics from current page data (simple count)
  const pendingCount = tasks.filter(t => t.status === 'PENDING' || t.status === 'AI_FILLING').length
  const reviewCount = tasks.filter(t => t.status === 'AI_DONE' || t.status === 'REVIEWING').length
  const exportCount = tasks.filter(t => t.status === 'REVIEW_DONE').length

  // Client-side search filter
  const filtered = debouncedSearch
    ? tasks.filter(t => t.customer_name.includes(debouncedSearch))
    : tasks

  function getActionBtn(task: ApiReportTask) {
    if (task.status === 'PENDING' || task.status === 'AI_FILLING') return { label: '查看进度', cls: 'btn-ai' }
    if (task.status === 'AI_DONE' || task.status === 'REVIEWING') return { label: '开始复核', cls: 'btn-review' }
    if (task.status === 'REVIEW_DONE') return { label: '导出材料包', cls: 'btn-export' }
    return { label: '查看', cls: 'btn-view' }
  }

  function handleCreated(task: ApiReportTask) {
    setShowCreate(false)
    navigate(`/reports/${task.id}`)
  }

  return (
    <div className="reports-page">
      <div className="page-header">
        <h1 className="page-title">报告作业台</h1>
        <button className="btn btn-primary btn-sm-create" onClick={() => setShowCreate(true)}>+ 新建任务</button>
      </div>

      <div className="metrics-row">
        <div className="metric-mini-card" style={{ borderLeft: '4px solid #2563eb', background: '#eff6ff' }}>
          <div className="metric-mini-value" style={{ color: '#2563eb' }}>{pendingCount}</div>
          <div className="metric-mini-label">待AI填写</div>
        </div>
        <div className="metric-mini-card" style={{ borderLeft: '4px solid #d97706', background: '#fffbeb' }}>
          <div className="metric-mini-value" style={{ color: '#d97706' }}>{reviewCount}</div>
          <div className="metric-mini-label">待复核</div>
        </div>
        <div className="metric-mini-card" style={{ borderLeft: '4px solid #16a34a', background: '#f0fdf4' }}>
          <div className="metric-mini-value" style={{ color: '#16a34a' }}>{exportCount}</div>
          <div className="metric-mini-label">待导出</div>
        </div>
        <div className="metric-mini-card" style={{ borderLeft: '4px solid #64748b', background: '#f8fafc' }}>
          <div className="metric-mini-value" style={{ color: '#64748b' }}>{total}</div>
          <div className="metric-mini-label">全部任务</div>
        </div>
      </div>

      <div className="card toolbar">
        <input
          className="search-input"
          placeholder="搜索客户名称..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select className="filter-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      <div className="card table-card">
        {loading ? (
          <div className="empty-state">加载中...</div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>客户名称</th>
                <th>银行 · 产品</th>
                <th>状态</th>
                <th>问题字段</th>
                <th>处理人</th>
                <th>更新时间</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(task => {
                const action = getActionBtn(task)
                return (
                  <tr
                    key={task.id}
                    className="table-row-hover"
                    onClick={() => navigate(`/reports/${task.id}`)}
                  >
                    <td>
                      <div className="cell-main">{task.customer_name}</div>
                    </td>
                    <td>
                      <span className="product-tag">{task.bank_short_name} · {task.product_name}</span>
                    </td>
                    <td><StatusBadge status={task.status} /></td>
                    <td>
                      {task.issue_count > 0
                        ? <span style={{ color: '#dc2626', fontWeight: 600 }}>{task.issue_count} 个问题</span>
                        : <span style={{ color: '#94a3b8' }}>—</span>}
                    </td>
                    <td className="cell-sub">{task.advisor_name || '—'}</td>
                    <td className="cell-sub">{formatDate(task.updated_at)}</td>
                    <td>
                      <button
                        className={`btn-sm ${action.cls}`}
                        onClick={e => { e.stopPropagation(); navigate(`/reports/${task.id}`) }}
                      >
                        {action.label}
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
        {!loading && filtered.length === 0 && (
          <div className="empty-state">没有匹配的作业任务</div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="pagination">
          <button className="page-btn" disabled={page === 1} onClick={() => setPage(p => p - 1)}>上一页</button>
          <span className="page-info">{page} / {totalPages}</span>
          <button className="page-btn" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>下一页</button>
        </div>
      )}

      {showCreate && <CreateTaskModal onClose={() => setShowCreate(false)} onCreated={handleCreated} />}
    </div>
  )
}
