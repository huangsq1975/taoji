import { useState, useEffect, useCallback, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { listCustomers, createCustomer, deleteCustomer, type ApiCustomer } from '../../utils/api'
import './Customers.css'

// ─── Status mapping ───────────────────────────────────────────────────────────

const STATUS_OPTIONS = [
  { value: '', label: '全部状态' },
  { value: 'COLLECTING', label: '资料收集' },
  { value: 'REVIEWING', label: '顾问复核' },
  { value: 'REPORTING', label: '报告生产' },
  { value: 'SUBMITTED', label: '已提交' },
  { value: 'DONE', label: '完成' },
  { value: 'PAUSED', label: '暂停' },
]

const STATUS_STYLE: Record<string, { bg: string; text: string }> = {
  COLLECTING: { bg: '#f0fdf4', text: '#16a34a' },
  REVIEWING:  { bg: '#eff6ff', text: '#2563eb' },
  REPORTING:  { bg: '#fffbeb', text: '#d97706' },
  SUBMITTED:  { bg: '#fdf4ff', text: '#9333ea' },
  DONE:       { bg: '#f0fdf4', text: '#15803d' },
  PAUSED:     { bg: '#f8fafc', text: '#64748b' },
}

function statusLabel(s: string) {
  return STATUS_OPTIONS.find(o => o.value === s)?.label ?? s
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const c = STATUS_STYLE[status] ?? { bg: '#f8fafc', text: '#64748b' }
  return <span className="badge" style={{ background: c.bg, color: c.text }}>{statusLabel(status)}</span>
}

function CompletionBar({ value }: { value: number }) {
  const color = value >= 80 ? '#16a34a' : value >= 50 ? '#d97706' : '#dc2626'
  return (
    <div className="progress-wrap">
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${value}%`, background: color }} />
      </div>
      <span className="progress-label">{value}%</span>
    </div>
  )
}

// ─── Create Customer Modal ────────────────────────────────────────────────────

interface CreateModalProps {
  onClose: () => void
  onCreated: (c: ApiCustomer) => void
}

function CreateCustomerModal({ onClose, onCreated }: CreateModalProps) {
  const [form, setForm] = useState({
    name: '', contactName: '', contactPhone: '',
    financingNeed: '', loanAmount: '', loanPurpose: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function setField(key: string, val: string) {
    setForm(f => ({ ...f, [key]: val }))
    setError('')
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) { setError('客户名称不能为空'); return }
    setLoading(true)
    try {
      const created = await createCustomer({
        name: form.name.trim(),
        contactName: form.contactName.trim() || undefined,
        contactPhone: form.contactPhone.trim() || undefined,
        financingNeed: form.financingNeed.trim() || undefined,
        loanAmount: form.loanAmount ? Number(form.loanAmount) : undefined,
        loanPurpose: form.loanPurpose.trim() || undefined,
      })
      onCreated(created)
    } catch (err) {
      setError(err instanceof Error ? err.message : '创建失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">新增客户</span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && <div className="modal-error">{error}</div>}
            <div className="form-row">
              <label>客户名称 <span className="required">*</span></label>
              <input placeholder="企业名称或个人姓名" value={form.name}
                onChange={e => setField('name', e.target.value)} />
            </div>
            <div className="form-row-2">
              <div className="form-row">
                <label>联系人</label>
                <input placeholder="联系人姓名" value={form.contactName}
                  onChange={e => setField('contactName', e.target.value)} />
              </div>
              <div className="form-row">
                <label>联系电话</label>
                <input placeholder="手机号" value={form.contactPhone}
                  onChange={e => setField('contactPhone', e.target.value)} />
              </div>
            </div>
            <div className="form-row-2">
              <div className="form-row">
                <label>意向金额（万元）</label>
                <input type="number" placeholder="如 300" value={form.loanAmount} min="0"
                  onChange={e => setField('loanAmount', e.target.value)} />
              </div>
              <div className="form-row">
                <label>资金用途</label>
                <input placeholder="如 流动资金" value={form.loanPurpose}
                  onChange={e => setField('loanPurpose', e.target.value)} />
              </div>
            </div>
            <div className="form-row">
              <label>融资诉求</label>
              <textarea placeholder="简要描述融资需求背景..." rows={3}
                value={form.financingNeed}
                onChange={e => setField('financingNeed', e.target.value)} />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>取消</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? '创建中…' : '确认创建'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Pagination ───────────────────────────────────────────────────────────────

function Pagination({ page, totalPages, total, pageSize, onChange }: {
  page: number; totalPages: number; total: number; pageSize: number; onChange: (p: number) => void
}) {
  if (totalPages <= 1) return null
  const start = (page - 1) * pageSize + 1
  const end = Math.min(page * pageSize, total)
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1)
    .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
    .reduce<(number | '…')[]>((acc, p, idx, arr) => {
      if (idx > 0 && (p as number) - (arr[idx - 1] as number) > 1) acc.push('…')
      acc.push(p)
      return acc
    }, [])

  return (
    <div className="pagination">
      <span className="pagination-info">共 {total} 条，第 {start}–{end} 条</span>
      <div className="pagination-btns">
        <button className="page-btn" disabled={page <= 1} onClick={() => onChange(page - 1)}>‹ 上一页</button>
        {pages.map((p, i) =>
          p === '…'
            ? <span key={`e${i}`} className="page-ellipsis">…</span>
            : <button key={p} className={`page-btn${p === page ? ' page-btn-active' : ''}`}
                onClick={() => onChange(p as number)}>{p}</button>
        )}
        <button className="page-btn" disabled={page >= totalPages} onClick={() => onChange(page + 1)}>下一页 ›</button>
      </div>
    </div>
  )
}

// ─── Delete Confirm Modal ─────────────────────────────────────────────────────

function DeleteConfirmModal({ customer, onClose, onDeleted }: {
  customer: ApiCustomer
  onClose: () => void
  onDeleted: (id: number) => void
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleConfirm() {
    setLoading(true)
    setError('')
    try {
      await deleteCustomer(customer.id)
      onDeleted(customer.id)
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除失败')
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" style={{ maxWidth: 420 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">确认删除客户</span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          {error && <div className="modal-error">{error}</div>}
          <p style={{ margin: 0, fontSize: 14, color: '#374151', lineHeight: 1.6 }}>
            确定删除客户 <strong>「{customer.name}」</strong> 吗？<br />
            删除后该客户的所有数据将不再显示，此操作不可恢复。
          </p>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose} disabled={loading}>取消</button>
          <button className="btn" style={{ background: '#dc2626', color: 'white' }}
            onClick={handleConfirm} disabled={loading}>
            {loading ? '删除中…' : '确认删除'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const PAGE_SIZE = 20

export default function Customers() {
  const navigate = useNavigate()
  const [customers, setCustomers] = useState<ApiCustomer[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [page, setPage] = useState(1)
  const [keyword, setKeyword] = useState('')
  const [debouncedKeyword, setDebouncedKeyword] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<ApiCustomer | null>(null)

  useEffect(() => {
    const t = setTimeout(() => setDebouncedKeyword(keyword), 400)
    return () => clearTimeout(t)
  }, [keyword])

  useEffect(() => { setPage(1) }, [debouncedKeyword, statusFilter])

  const fetchCustomers = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const result = await listCustomers({
        keyword: debouncedKeyword || undefined,
        status: statusFilter || undefined,
        page,
        pageSize: PAGE_SIZE,
      })
      setCustomers(result.items)
      setTotal(result.total)
      setTotalPages(result.totalPages)
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败')
    } finally {
      setLoading(false)
    }
  }, [debouncedKeyword, statusFilter, page])

  useEffect(() => { fetchCustomers() }, [fetchCustomers])

  function handleCreated(c: ApiCustomer) {
    setShowCreate(false)
    navigate(`/customers/${c.id}`)
  }

  function handleDeleted(id: number) {
    setConfirmDelete(null)
    setCustomers(prev => prev.filter(c => c.id !== id))
    setTotal(prev => prev - 1)
  }

  return (
    <div className="customers-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">客户列表</h1>
          {!loading && <span className="page-subtitle">共 {total} 位客户</span>}
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>+ 新增客户</button>
      </div>

      <div className="toolbar card">
        <input
          className="search-input"
          placeholder="搜索客户名称、联系人、联系电话..."
          value={keyword}
          onChange={e => setKeyword(e.target.value)}
        />
        <select
          className="filter-select"
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
        >
          {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        {(debouncedKeyword || statusFilter) && (
          <button className="sort-btn" onClick={() => { setKeyword(''); setStatusFilter('') }}>
            清除筛选 ✕
          </button>
        )}
      </div>

      <div className="card table-card">
        {loading && (
          <div className="loading-state">
            <div className="loading-spinner" />
            <span>加载中…</span>
          </div>
        )}

        {error && !loading && (
          <div className="error-state">
            <span>⚠ {error}</span>
            <button className="btn btn-ghost" onClick={fetchCustomers}>重试</button>
          </div>
        )}

        {!loading && !error && (
          <>
            <table className="data-table">
              <thead>
                <tr>
                  <th>客户名称</th>
                  <th>状态</th>
                  <th>意向金额</th>
                  <th>资料完整度</th>
                  <th>标签</th>
                  <th>融资诉求</th>
                  <th>顾问</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {customers.map(c => (
                  <tr key={c.id} className="table-row-hover"
                    onClick={() => navigate(`/customers/${c.id}`)}>
                    <td>
                      <div className="cell-main">{c.name}</div>
                      {c.contactName && (
                        <div className="cell-sub">
                          {c.contactName}{c.contactPhone ? ' · ' + c.contactPhone : ''}
                        </div>
                      )}
                    </td>
                    <td><StatusBadge status={c.status} /></td>
                    <td>
                      {c.loanAmount != null
                        ? <span className="amount-text">{Number(c.loanAmount).toLocaleString()} 万</span>
                        : <span className="cell-muted">—</span>}
                      {c.loanPurpose && <div className="cell-sub">{c.loanPurpose}</div>}
                    </td>
                    <td><CompletionBar value={c.docCompleteness} /></td>
                    <td>
                      <div className="qual-tags">
                        {c.labels.length > 0
                          ? c.labels.map(l => <span key={l} className="qual-tag">{l}</span>)
                          : <span className="cell-muted">—</span>}
                      </div>
                    </td>
                    <td>
                      <span className="block-text">
                        {c.financingNeed || <span className="cell-muted">—</span>}
                      </span>
                    </td>
                    <td>
                      {c.advisorName
                        ? <span className="advisor-chip">{c.advisorName}</span>
                        : <span className="cell-muted">未分配</span>}
                      <div className="cell-sub">{formatDate(c.updatedAt)}</div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn-sm btn-primary"
                          onClick={e => { e.stopPropagation(); navigate('/reports') }}>
                          AI填表
                        </button>
                        <button className="btn-sm"
                          style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }}
                          onClick={e => { e.stopPropagation(); setConfirmDelete(c) }}>
                          删除
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {customers.length === 0 && (
              <div className="empty-state">
                {debouncedKeyword || statusFilter
                  ? '没有找到匹配的客户'
                  : '暂无客户，点击"新增客户"开始'}
              </div>
            )}

            <Pagination page={page} totalPages={totalPages} total={total}
              pageSize={PAGE_SIZE} onChange={setPage} />
          </>
        )}
      </div>

      {showCreate && (
        <CreateCustomerModal onClose={() => setShowCreate(false)} onCreated={handleCreated} />
      )}
      {confirmDelete && (
        <DeleteConfirmModal
          customer={confirmDelete}
          onClose={() => setConfirmDelete(null)}
          onDeleted={handleDeleted}
        />
      )}
    </div>
  )
}

function formatDate(iso: string): string {
  if (!iso) return ''
  try {
    const d = new Date(iso)
    const diff = Date.now() - d.getTime()
    if (diff < 60000) return '刚刚'
    if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`
    if (diff < 7 * 86400000) return `${Math.floor(diff / 86400000)} 天前`
    return d.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
  } catch {
    return ''
  }
}
