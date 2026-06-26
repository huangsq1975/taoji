import { useState, useEffect, useCallback, FormEvent, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  getCustomer, getCustomerOverview, listDocuments, uploadDocument, deleteDocument,
  listFollowUps, addFollowUp, listReportTasks, createReportTask, listBanks, listBankProducts,
  type ApiCustomer, type CustomerOverview, type ApiDocument, type ApiFollowUp, type ApiReportTask,
  type ApiBank, type ApiProduct,
} from '../../utils/api'
import './CustomerDetail.css'

// ─── Constants ────────────────────────────────────────────────────────────────

const TABS = ['客户总览', '客户资料', '报告产出', '跟进记录']

const STATUS_STYLE: Record<string, { bg: string; text: string }> = {
  COLLECTING: { bg: '#f0fdf4', text: '#16a34a' },
  REVIEWING:  { bg: '#eff6ff', text: '#2563eb' },
  REPORTING:  { bg: '#fffbeb', text: '#d97706' },
  SUBMITTED:  { bg: '#fdf4ff', text: '#9333ea' },
  DONE:       { bg: '#dcfce7', text: '#15803d' },
  PAUSED:     { bg: '#f8fafc', text: '#64748b' },
}
const STATUS_LABEL: Record<string, string> = {
  COLLECTING: '资料收集', REVIEWING: '顾问复核', REPORTING: '报告生产',
  SUBMITTED: '已提交', DONE: '完成', PAUSED: '暂停',
}

const DOC_TYPE_LABEL: Record<string, string> = {
  BUSINESS_LICENSE: '营业执照', BANK_STATEMENT: '银行流水', CREDIT_REPORT: '征信报告',
  TAX_INVOICE: '税票', PROPERTY_CERT: '不动产证', ID_CARD: '身份证',
  FINANCIAL_STATEMENT: '财务报表', OTHER: '其他材料',
}
const DOC_TYPES = Object.entries(DOC_TYPE_LABEL).map(([value, label]) => ({ value, label }))

const FOLLOW_UP_TYPES = [
  { value: 'NOTE', label: '备注' },
  { value: 'SUPPLEMENT_REQUEST', label: '补件请求' },
  { value: 'BANK_SUBMIT', label: '提交银行' },
  { value: 'BANK_FEEDBACK', label: '银行反馈' },
]
const FOLLOW_UP_LABEL: Record<string, string> = {
  NOTE: '备注', SUPPLEMENT_REQUEST: '补件请求', BANK_SUBMIT: '提交银行',
  BANK_FEEDBACK: '银行反馈', SYSTEM: '系统',
}

const REPORT_STATUS_LABEL: Record<string, string> = {
  PENDING: '待填写', AI_FILLING: 'AI填写中', AI_DONE: 'AI完成',
  REVIEWING: '顾问复核', REVIEW_DONE: '复核完成', EXPORTING: '导出中',
  EXPORTED: '已导出', SUBMITTED: '已提交',
}
const REPORT_STATUS_STYLE: Record<string, { bg: string; text: string }> = {
  PENDING:     { bg: '#f8fafc', text: '#64748b' },
  AI_FILLING:  { bg: '#eff6ff', text: '#2563eb' },
  AI_DONE:     { bg: '#dbeafe', text: '#1d4ed8' },
  REVIEWING:   { bg: '#fffbeb', text: '#d97706' },
  REVIEW_DONE: { bg: '#f0fdf4', text: '#16a34a' },
  EXPORTING:   { bg: '#fdf4ff', text: '#9333ea' },
  EXPORTED:    { bg: '#dcfce7', text: '#15803d' },
  SUBMITTED:   { bg: '#f0fdf4', text: '#15803d' },
}

// ─── Shared helpers ───────────────────────────────────────────────────────────

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  try {
    const d = new Date(iso)
    const diff = Date.now() - d.getTime()
    if (diff < 60000) return '刚刚'
    if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`
    if (diff < 7 * 86400000) return `${Math.floor(diff / 86400000)} 天前`
    return d.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' })
  } catch { return '—' }
}

function formatBytes(b: number | null | undefined): string {
  if (!b) return ''
  if (b < 1024) return `${b} B`
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`
  return `${(b / 1024 / 1024).toFixed(1)} MB`
}

function StatusBadge({ status }: { status: string }) {
  const c = STATUS_STYLE[status] ?? { bg: '#f8fafc', text: '#64748b' }
  return <span className="badge" style={{ background: c.bg, color: c.text }}>{STATUS_LABEL[status] ?? status}</span>
}

function Spinner() {
  return <div className="loading-state"><div className="loading-spinner" /><span>加载中…</span></div>
}

function ErrorRetry({ msg, onRetry }: { msg: string; onRetry: () => void }) {
  return (
    <div className="error-state">
      <span>⚠ {msg}</span>
      <button className="btn btn-ghost" onClick={onRetry}>重试</button>
    </div>
  )
}

// ─── Tab 0: 客户总览 ──────────────────────────────────────────────────────────

function OverviewTab({ customer, overview }: { customer: ApiCustomer; overview: CustomerOverview | null }) {
  const pct = customer.docCompleteness
  const pctColor = pct >= 80 ? '#16a34a' : pct >= 50 ? '#d97706' : '#dc2626'

  return (
    <div className="tab-content">
      {/* Summary cards */}
      <div className="overview-stats">
        {[
          { label: '关联文档', value: overview?.docCount ?? '—', icon: '📄' },
          { label: '跟进记录', value: overview?.followUpCount ?? '—', icon: '📝' },
          { label: '已签授权', value: overview?.authSignedCount ?? '—', icon: '✅' },
          { label: '报告任务', value: overview?.reportCount ?? '—', icon: '📋' },
        ].map(s => (
          <div key={s.label} className="stat-card card">
            <div className="stat-icon">{s.icon}</div>
            <div className="stat-value">{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Completeness */}
      <div className="readiness-card card">
        <div className="readiness-score" style={{ borderColor: pctColor }}>
          <div className="readiness-num" style={{ color: pctColor }}>{pct}</div>
          <div className="readiness-label">资料完整度</div>
        </div>
        <div className="readiness-info">
          <h3 className="readiness-title">资料准备状态</h3>
          <div className="readiness-progress">
            <div className="progress-bar-wide">
              <div className="progress-fill-wide" style={{ width: `${pct}%`, background: pctColor }} />
            </div>
            <span className="readiness-pct">{pct}%</span>
          </div>
          {customer.financingNeed && (
            <div className="info-row">
              <span className="info-label">融资诉求</span>
              <span className="info-value">{customer.financingNeed}</span>
            </div>
          )}
          {customer.loanPurpose && (
            <div className="info-row">
              <span className="info-label">资金用途</span>
              <span className="info-value">{customer.loanPurpose}</span>
            </div>
          )}
        </div>
        {customer.labels.length > 0 && (
          <div className="qual-section">
            <div className="qual-title">标签</div>
            <div className="qual-tags">
              {customer.labels.map(l => <span key={l} className="qual-tag-lg">{l}</span>)}
            </div>
          </div>
        )}
      </div>

      {/* AI summary */}
      {customer.aiSummary && (
        <>
          <h3 className="section-title">AI客户画像摘要</h3>
          <div className="card ai-summary-card">
            <div className="ai-summary-icon">🤖</div>
            <p className="ai-summary-text">{customer.aiSummary}</p>
          </div>
        </>
      )}

      {/* Risk notes */}
      {customer.riskNotes && (
        <>
          <h3 className="section-title" style={{ marginTop: 20 }}>风险关注点</h3>
          <div className="card risk-card">
            <div className="risk-icon">⚠️</div>
            <p className="risk-text">{customer.riskNotes}</p>
          </div>
        </>
      )}

      {/* Basic info */}
      <h3 className="section-title" style={{ marginTop: 20 }}>基本信息</h3>
      <div className="profile-grid">
        {[
          { label: '客户名称', value: customer.name },
          { label: '联系人', value: customer.contactName },
          { label: '联系电话', value: customer.contactPhone },
          { label: '意向金额', value: customer.loanAmount != null ? `${Number(customer.loanAmount).toLocaleString()} 万元` : null },
          { label: '负责顾问', value: customer.advisorName },
          { label: '创建时间', value: formatDate(customer.createdAt) },
        ].filter(i => i.value).map(i => (
          <div key={i.label} className="profile-card card">
            <div className="profile-card-label">{i.label}</div>
            <div className="profile-card-value">{i.value}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Tab 1: 客户资料 ──────────────────────────────────────────────────────────

function DocParseStatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; text: string; label: string }> = {
    PENDING:    { bg: '#f8fafc', text: '#64748b', label: '待解析' },
    PROCESSING: { bg: '#eff6ff', text: '#2563eb', label: '解析中' },
    DONE:       { bg: '#f0fdf4', text: '#16a34a', label: '已完成' },
    FAILED:     { bg: '#fef2f2', text: '#dc2626', label: '解析失败' },
  }
  const c = map[status] ?? map['PENDING']
  return <span className="badge" style={{ background: c.bg, color: c.text }}>{c.label}</span>
}

function DocumentsTab({ customerId }: { customerId: number }) {
  const [docs, setDocs] = useState<ApiDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadDocType, setUploadDocType] = useState('BUSINESS_LICENSE')
  const fileRef = useRef<HTMLInputElement>(null)

  const fetchDocs = useCallback(async () => {
    setLoading(true); setError('')
    try { setDocs(await listDocuments(customerId)) }
    catch (e) { setError(e instanceof Error ? e.message : '加载失败') }
    finally { setLoading(false) }
  }, [customerId])

  useEffect(() => { fetchDocs() }, [fetchDocs])

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (files.length === 0) return
    setUploading(true)
    try {
      for (const file of files) {
        await uploadDocument(customerId, uploadDocType, file)
      }
      await fetchDocs()
    } catch (err) {
      alert(err instanceof Error ? err.message : '上传失败')
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('确认删除该文档？')) return
    try { await deleteDocument(id); setDocs(d => d.filter(x => x.id !== id)) }
    catch (e) { alert(e instanceof Error ? e.message : '删除失败') }
  }

  return (
    <div className="tab-content">
      <div className="doc-actions">
        <select className="filter-select" value={uploadDocType} onChange={e => setUploadDocType(e.target.value)}>
          {DOC_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
        <button className="btn btn-primary" disabled={uploading}
          onClick={() => fileRef.current?.click()}>
          {uploading ? '上传中…' : '📎 上传资料'}
        </button>
        <input ref={fileRef} type="file" style={{ display: 'none' }}
          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
          multiple
          onChange={handleFileChange} />
      </div>

      {loading && <Spinner />}
      {error && !loading && <ErrorRetry msg={error} onRetry={fetchDocs} />}

      {!loading && !error && (
        <div className="card table-card">
          <table className="data-table">
            <thead>
              <tr>
                <th>文件名</th>
                <th>类型</th>
                <th>大小</th>
                <th>上传方</th>
                <th>AI解析</th>
                <th>上传时间</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {docs.map(d => (
                <tr key={d.id}>
                  <td>
                    <a className="doc-filename" href={d.fileUrl} target="_blank" rel="noreferrer">
                      {d.fileName}
                    </a>
                  </td>
                  <td><span className="cell-sub">{DOC_TYPE_LABEL[d.docType] ?? d.docType}</span></td>
                  <td><span className="cell-sub">{formatBytes(d.fileSize)}</span></td>
                  <td><span className="cell-sub">{d.uploaderType === 'customer' ? 'C端客户' : '顾问'}</span></td>
                  <td><DocParseStatusBadge status={d.aiParseStatus} /></td>
                  <td><span className="cell-sub">{formatDate(d.createdAt)}</span></td>
                  <td>
                    <button className="btn-text-danger" onClick={() => handleDelete(d.id)}>删除</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {docs.length === 0 && (
            <div className="empty-state">暂无资料，请上传客户文件</div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── New Task Modal ───────────────────────────────────────────────────────────

function NewTaskModal({ customerId, onClose, onCreated }: {
  customerId: number
  onClose: () => void
  onCreated: (task: ApiReportTask) => void
}) {
  const [banks, setBanks] = useState<ApiBank[]>([])
  const [products, setProducts] = useState<ApiProduct[]>([])
  const [bankId, setBankId] = useState<number | ''>('')
  const [productId, setProductId] = useState<number | ''>('')
  const [loadingBanks, setLoadingBanks] = useState(true)
  const [loadingProducts, setLoadingProducts] = useState(false)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    listBanks()
      .then(b => setBanks(b))
      .catch(() => {})
      .finally(() => setLoadingBanks(false))
  }, [])

  useEffect(() => {
    if (!bankId) { setProducts([]); setProductId(''); return }
    setLoadingProducts(true)
    listBankProducts(bankId as number)
      .then(p => { setProducts(p); setProductId('') })
      .catch(() => setProducts([]))
      .finally(() => setLoadingProducts(false))
  }, [bankId])

  async function handleCreate() {
    if (!productId) return
    setCreating(true); setError('')
    try {
      const task = await createReportTask({ customerId, productId: productId as number })
      onCreated(task)
    } catch (e) {
      setError(e instanceof Error ? e.message : '创建失败')
      setCreating(false)
    }
  }

  return (
    <div className="modal-mask" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">新建AI填表任务</span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="modal-form-field">
            <label className="modal-form-label">选择银行<span className="modal-required">*</span></label>
            {loadingBanks ? <span className="cell-sub">加载中…</span> : (
              <select className="filter-select modal-select"
                value={bankId}
                onChange={e => setBankId(e.target.value ? Number(e.target.value) : '')}>
                <option value="">请选择银行</option>
                {banks.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            )}
          </div>
          <div className="modal-form-field">
            <label className="modal-form-label">选择产品<span className="modal-required">*</span></label>
            <select className="filter-select modal-select"
              value={productId}
              disabled={!bankId || loadingProducts}
              onChange={e => setProductId(e.target.value ? Number(e.target.value) : '')}>
              <option value="">
                {!bankId ? '请先选择银行' : loadingProducts ? '加载中…' : products.length === 0 ? '暂无可用产品' : '请选择产品'}
              </option>
              {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          {error && <div className="modal-form-error">{error}</div>}
        </div>
        <div className="modal-footer">
          <button className="btn btn-outline" onClick={onClose}>取消</button>
          <button className="btn btn-primary"
            disabled={!productId || creating}
            onClick={handleCreate}>
            {creating ? '创建中…' : '🤖 创建并开始填写'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Tab 2: 报告产出 ──────────────────────────────────────────────────────────

function ReportsTab({ customerId }: { customerId: number }) {
  const navigate = useNavigate()
  const [tasks, setTasks] = useState<ApiReportTask[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showModal, setShowModal] = useState(false)

  const fetchTasks = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const result = await listReportTasks({ customerId, pageSize: 50 })
      setTasks(result.items)
    } catch (e) { setError(e instanceof Error ? e.message : '加载失败') }
    finally { setLoading(false) }
  }, [customerId])

  useEffect(() => { fetchTasks() }, [fetchTasks])

  return (
    <div className="tab-content">
      <div className="report-header-row">
        <span className="section-title" style={{ margin: 0 }}>AI填表任务</span>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          🤖 新建AI填表任务
        </button>
      </div>

      {loading && <Spinner />}
      {error && !loading && <ErrorRetry msg={error} onRetry={fetchTasks} />}

      {!loading && !error && (
        <div className="card table-card" style={{ marginTop: 16 }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>任务ID</th>
                <th>银行 · 产品</th>
                <th>状态</th>
                <th>问题字段</th>
                <th>创建时间</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map(t => {
                const sc = REPORT_STATUS_STYLE[t.status] ?? { bg: '#f8fafc', text: '#64748b' }
                return (
                  <tr key={t.id} className="table-row-hover" onClick={() => navigate(`/reports/${t.id}`)}>
                    <td className="cell-main">#{t.id}</td>
                    <td>
                      <div style={{ fontWeight: 500, fontSize: 13, color: '#0f172a' }}>{t.bank_short_name}</div>
                      <div className="cell-sub">{t.product_name}</div>
                    </td>
                    <td>
                      <span className="badge" style={{ background: sc.bg, color: sc.text }}>
                        {REPORT_STATUS_LABEL[t.status] ?? t.status}
                      </span>
                    </td>
                    <td>
                      {t.issue_count > 0
                        ? <span className="issue-count">{t.issue_count} 个问题</span>
                        : <span className="cell-sub">—</span>}
                    </td>
                    <td><span className="cell-sub">{formatDate(t.created_at)}</span></td>
                    <td>
                      <button className="btn-sm btn-primary"
                        onClick={e => { e.stopPropagation(); navigate(`/reports/${t.id}`) }}>
                        查看详情
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {tasks.length === 0 && (
            <div className="empty-state">暂无报告任务，点击"新建AI填表任务"开始</div>
          )}
        </div>
      )}

      {showModal && (
        <NewTaskModal
          customerId={customerId}
          onClose={() => setShowModal(false)}
          onCreated={task => {
            setTasks(prev => [task, ...prev])
            setShowModal(false)
            navigate(`/reports/${task.id}`)
          }}
        />
      )}
    </div>
  )
}

// ─── Tab 3: 跟进记录 ──────────────────────────────────────────────────────────

function FollowUpsTab({ customerId }: { customerId: number }) {
  const [followUps, setFollowUps] = useState<ApiFollowUp[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [content, setContent] = useState('')
  const [type, setType] = useState('NOTE')
  const [submitting, setSubmitting] = useState(false)

  const fetchFollowUps = useCallback(async () => {
    setLoading(true); setError('')
    try { setFollowUps(await listFollowUps(customerId)) }
    catch (e) { setError(e instanceof Error ? e.message : '加载失败') }
    finally { setLoading(false) }
  }, [customerId])

  useEffect(() => { fetchFollowUps() }, [fetchFollowUps])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!content.trim()) return
    setSubmitting(true)
    try {
      const created = await addFollowUp(customerId, { type, content: content.trim() })
      setFollowUps(prev => [created, ...prev])
      setContent('')
    } catch (err) {
      alert(err instanceof Error ? err.message : '提交失败')
    } finally {
      setSubmitting(false)
    }
  }

  const followUpTypeStyle: Record<string, string> = {
    NOTE: 'type-note', SUPPLEMENT_REQUEST: 'type-supplement',
    BANK_SUBMIT: 'type-bank', BANK_FEEDBACK: 'type-feedback', SYSTEM: 'type-system',
  }

  return (
    <div className="tab-content">
      {/* Add record form */}
      <div className="new-note card">
        <h3 className="section-title" style={{ marginBottom: 12 }}>添加跟进记录</h3>
        <form onSubmit={handleSubmit}>
          <div className="note-type-btns" style={{ marginBottom: 10 }}>
            {FOLLOW_UP_TYPES.map(t => (
              <button key={t.value} type="button"
                className={`type-btn${type === t.value ? ' type-btn-active' : ''}`}
                onClick={() => setType(t.value)}>
                {t.label}
              </button>
            ))}
          </div>
          <textarea
            className="note-textarea"
            placeholder="记录本次跟进情况、重要节点、待办事项..."
            value={content}
            onChange={e => setContent(e.target.value)}
            rows={3}
          />
          <div className="note-footer">
            <button type="submit" className="btn btn-primary"
              disabled={!content.trim() || submitting}>
              {submitting ? '提交中…' : '提交记录'}
            </button>
          </div>
        </form>
      </div>

      {/* Timeline */}
      {loading && <Spinner />}
      {error && !loading && <ErrorRetry msg={error} onRetry={fetchFollowUps} />}

      {!loading && !error && (
        <div className="followup-list">
          {followUps.length === 0 && (
            <div className="empty-state" style={{ marginTop: 16 }}>暂无跟进记录</div>
          )}
          {followUps.map(f => (
            <div key={f.id} className="followup-item">
              <div className="followup-timeline">
                <div className="followup-dot" />
                <div className="followup-line" />
              </div>
              <div className="followup-body card">
                <div className="followup-header">
                  <span className="followup-author">{f.advisorName ?? '系统'}</span>
                  <span className={`followup-type ${followUpTypeStyle[f.type] ?? 'type-note'}`}>
                    {FOLLOW_UP_LABEL[f.type] ?? f.type}
                  </span>
                  <span className="followup-date">{formatDate(f.createdAt)}</span>
                </div>
                <div className="followup-content">{f.content}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function CustomerDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState(0)
  const [customer, setCustomer] = useState<ApiCustomer | null>(null)
  const [overview, setOverview] = useState<CustomerOverview | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const customerId = Number(id)

  const fetchHeader = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const [cust, ov] = await Promise.all([
        getCustomer(customerId),
        getCustomerOverview(customerId),
      ])
      setCustomer(cust)
      setOverview(ov)
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载失败')
    } finally {
      setLoading(false)
    }
  }, [customerId])

  useEffect(() => { fetchHeader() }, [fetchHeader])

  if (loading) return <div className="customer-detail"><Spinner /></div>

  if (error || !customer) {
    return (
      <div className="customer-detail">
        <ErrorRetry msg={error || '客户不存在'} onRetry={fetchHeader} />
        <button className="back-btn" style={{ marginTop: 16 }} onClick={() => navigate('/customers')}>
          ← 返回列表
        </button>
      </div>
    )
  }

  return (
    <div className="customer-detail">
      {/* Header */}
      <div className="detail-header">
        <button className="back-btn" onClick={() => navigate('/customers')}>← 返回列表</button>
        <div className="detail-title-row">
          <h1 className="detail-title">{customer.name}</h1>
          <div className="detail-tags">
            <StatusBadge status={customer.status} />
            {customer.loanAmount != null && (
              <span className="badge" style={{ background: '#eff6ff', color: '#1d4ed8' }}>
                {Number(customer.loanAmount).toLocaleString()} 万
              </span>
            )}
          </div>
        </div>
        <div className="detail-meta">
          {customer.contactName && <><span>联系人：{customer.contactName}</span><span className="sep">·</span></>}
          {customer.contactPhone && <><span>{customer.contactPhone}</span><span className="sep">·</span></>}
          {customer.advisorName && <><span>顾问：{customer.advisorName}</span><span className="sep">·</span></>}
          <span>更新：{formatDate(customer.updatedAt)}</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        {TABS.map((tab, i) => (
          <button key={tab}
            className={`tab-btn${activeTab === i ? ' tab-btn-active' : ''}`}
            onClick={() => setActiveTab(i)}>
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 0 && <OverviewTab customer={customer} overview={overview} />}
      {activeTab === 1 && <DocumentsTab customerId={customerId} />}
      {activeTab === 2 && <ReportsTab customerId={customerId} />}
      {activeTab === 3 && <FollowUpsTab customerId={customerId} />}
    </div>
  )
}
