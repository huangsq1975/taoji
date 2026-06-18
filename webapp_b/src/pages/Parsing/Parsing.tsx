import { useState, useEffect, useCallback } from 'react'
import {
  listAllDocuments,
  confirmDocument,
  retryParseDocument,
  listCustomers,
  uploadDocument,
  ApiDocument,
} from '../../utils/api'
import './Parsing.css'

const DOC_TYPE_OPTIONS = [
  { value: 'BUSINESS_LICENSE', label: '营业执照' },
  { value: 'ID_CARD', label: '身份证' },
  { value: 'BANK_STATEMENT', label: '银行流水' },
  { value: 'CREDIT_REPORT', label: '征信报告' },
  { value: 'TAX_INVOICE', label: '纳税证明' },
  { value: 'FINANCIAL_STATEMENT', label: '财务报表' },
  { value: 'PROPERTY_CERT', label: '不动产证' },
  { value: 'OTHER', label: '其他材料' },
]

const DOC_TYPE_LABEL: Record<string, string> = {
  BUSINESS_LICENSE: '营业执照', BANK_STATEMENT: '银行流水', CREDIT_REPORT: '征信报告',
  TAX_INVOICE: '纳税证明', PROPERTY_CERT: '不动产证', ID_CARD: '身份证',
  FINANCIAL_STATEMENT: '财务报表', OTHER: '其他材料',
}

const STATUS_FILTER_OPTIONS = [
  { value: '', label: '全部状态' },
  { value: 'DONE', label: '已确认' },
  { value: 'PENDING', label: '待确认' },
  { value: 'FAILED', label: '识别失败' },
]

function parseStatusInfo(status: string): { label: string; bg: string; text: string } {
  if (status === 'DONE') return { label: '已确认', bg: '#f0fdf4', text: '#16a34a' }
  if (status === 'PENDING' || status === 'PROCESSING') return { label: '待确认', bg: '#fffbeb', text: '#d97706' }
  if (status === 'FAILED') return { label: '识别失败', bg: '#fef2f2', text: '#dc2626' }
  return { label: status, bg: '#f8fafc', text: '#64748b' }
}

function ConfBadge({ conf }: { conf?: number | null }) {
  if (conf == null) return <span className="cell-sub">—</span>
  if (conf >= 90) return <span className="badge badge-high">{conf}%</span>
  if (conf >= 75) return <span className="badge badge-mid">{conf}%</span>
  return <span className="badge badge-low">{conf}%</span>
}

function Spinner() {
  return <div className="spinner-wrap"><div className="spinner" /></div>
}

// ─── 修正文件类型弹窗 ──────────────────────────────────────────────────────────

interface ReclassifyModalProps {
  doc: ApiDocument
  onDone: (updated: ApiDocument) => void
  onClose: () => void
}

function ReclassifyModal({ doc, onDone, onClose }: ReclassifyModalProps) {
  const [docType, setDocType] = useState(doc.docType || '')
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')

  async function handleConfirm() {
    if (!docType) { setErr('请选择文件类型'); return }
    setLoading(true)
    setErr('')
    try {
      const updated = await confirmDocument(doc.id, docType)
      onDone(updated)
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : '操作失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-mask" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">修正文件类型</span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="hint-box">
            <div className="hint-row">
              <span className="hint-label">文件名：</span>
              <span className="hint-value">{doc.fileName}</span>
            </div>
            {doc.aiDocType && (
              <div className="hint-row">
                <span className="hint-label">AI识别：</span>
                <span>{DOC_TYPE_LABEL[doc.aiDocType] ?? doc.aiDocType}</span>
              </div>
            )}
          </div>
          <div className="form-field">
            <label className="form-label">正确类型<span className="required">*</span></label>
            <select className="form-select" value={docType} onChange={e => setDocType(e.target.value)}>
              <option value="">请选择</option>
              {DOC_TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          {err && <div className="form-error">{err}</div>}
        </div>
        <div className="modal-footer">
          <button className="btn btn-outline" onClick={onClose}>取消</button>
          <button className="btn btn-primary" onClick={handleConfirm} disabled={loading || !docType}>
            {loading ? '确认中...' : '确认类型'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── 上传文件弹窗 ──────────────────────────────────────────────────────────────

interface UploadModalProps {
  onDone: () => void
  onClose: () => void
}

function UploadModal({ onDone, onClose }: UploadModalProps) {
  const [customers, setCustomers] = useState<{ id: number; name: string }[]>([])
  const [customerId, setCustomerId] = useState('')
  const [docType, setDocType] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')

  useEffect(() => {
    listCustomers({ pageSize: 200 }).then(r =>
      setCustomers(r.items.map(c => ({ id: c.id, name: c.name })))
    )
  }, [])

  async function handleUpload() {
    if (!customerId || !docType || !file) { setErr('请填写所有必填项'); return }
    setLoading(true)
    setErr('')
    try {
      await uploadDocument(Number(customerId), docType, file)
      onDone()
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : '上传失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-mask" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">上传文件</span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="form-field">
            <label className="form-label">归属客户<span className="required">*</span></label>
            <select className="form-select" value={customerId} onChange={e => setCustomerId(e.target.value)}>
              <option value="">请选择客户</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="form-field">
            <label className="form-label">文件类型<span className="required">*</span></label>
            <select className="form-select" value={docType} onChange={e => setDocType(e.target.value)}>
              <option value="">请选择类型</option>
              {DOC_TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div className="form-field">
            <label className="form-label">选择文件<span className="required">*</span></label>
            <input
              type="file"
              className="form-file"
              accept=".pdf,.jpg,.jpeg,.png,.xlsx,.xls"
              onChange={e => setFile(e.target.files?.[0] ?? null)}
            />
          </div>
          {err && <div className="form-error">{err}</div>}
        </div>
        <div className="modal-footer">
          <button className="btn btn-outline" onClick={onClose}>取消</button>
          <button
            className="btn btn-primary"
            onClick={handleUpload}
            disabled={loading || !customerId || !docType || !file}
          >
            {loading ? '上传中...' : '上传'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── 主页面 ────────────────────────────────────────────────────────────────────

export default function Parsing() {
  const [docs, setDocs] = useState<ApiDocument[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [customerSearch, setCustomerSearch] = useState('')
  const [page, setPage] = useState(1)
  const pageSize = 20
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [reclassifyDoc, setReclassifyDoc] = useState<ApiDocument | null>(null)
  const [showUpload, setShowUpload] = useState(false)
  const [batchConfirming, setBatchConfirming] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setErr('')
    try {
      const res = await listAllDocuments({
        aiParseStatus: statusFilter || undefined,
        page,
        pageSize,
      })
      setDocs(res.items)
      setTotal(res.total)
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : '加载失败')
    } finally {
      setLoading(false)
    }
  }, [statusFilter, page, pageSize])

  useEffect(() => { setPage(1) }, [statusFilter])
  useEffect(() => { load() }, [load])

  // Client-side customer filter
  const filtered = customerSearch
    ? docs.filter(d => (d.customerName ?? '').includes(customerSearch))
    : docs

  const totalPages = Math.ceil(total / pageSize)

  // Metrics from loaded page
  const todayCount = docs.filter(d => {
    try { return new Date(d.createdAt).toDateString() === new Date().toDateString() }
    catch { return false }
  }).length
  const doneCount = docs.filter(d => d.aiParseStatus === 'DONE').length
  const pendingCount = docs.filter(d => d.aiParseStatus === 'PENDING' || d.aiParseStatus === 'PROCESSING').length
  const failedCount = docs.filter(d => d.aiParseStatus === 'FAILED').length

  const metrics = [
    { label: '今日上传', value: todayCount, color: '#2563eb', bg: '#eff6ff' },
    { label: 'AI已识别', value: doneCount, color: '#16a34a', bg: '#f0fdf4' },
    { label: '待顾问确认', value: pendingCount, color: '#d97706', bg: '#fffbeb' },
    { label: '识别失败', value: failedCount, color: '#dc2626', bg: '#fef2f2' },
  ]

  async function handleConfirm(doc: ApiDocument) {
    try {
      const updated = await confirmDocument(doc.id)
      setDocs(prev => prev.map(d => d.id === updated.id ? updated : d))
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : '确认失败')
    }
  }

  async function handleRetry(doc: ApiDocument) {
    try {
      const updated = await retryParseDocument(doc.id)
      setDocs(prev => prev.map(d => d.id === updated.id ? updated : d))
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : '重新识别失败')
    }
  }

  function handleReclassified(updated: ApiDocument) {
    setDocs(prev => prev.map(d => d.id === updated.id ? updated : d))
    setReclassifyDoc(null)
  }

  async function handleBatchConfirm() {
    const targets = filtered.filter(d =>
      selected.has(d.id) && (d.aiParseStatus === 'PENDING' || d.aiParseStatus === 'PROCESSING')
    )
    if (targets.length === 0) { alert('请先勾选待确认的文件'); return }
    setBatchConfirming(true)
    try {
      const results = await Promise.all(targets.map(d => confirmDocument(d.id)))
      setDocs(prev => {
        const map = new Map(results.map(r => [r.id, r]))
        return prev.map(d => map.has(d.id) ? map.get(d.id)! : d)
      })
      setSelected(new Set())
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : '批量确认失败')
    } finally {
      setBatchConfirming(false)
    }
  }

  function toggleSelect(id: number) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleSelectAll() {
    const ids = filtered.map(d => d.id)
    const allChosen = ids.length > 0 && ids.every(id => selected.has(id))
    setSelected(prev => {
      const next = new Set(prev)
      if (allChosen) ids.forEach(id => next.delete(id))
      else ids.forEach(id => next.add(id))
      return next
    })
  }

  const allSelected = filtered.length > 0 && filtered.every(d => selected.has(d.id))

  function formatDate(iso: string) {
    try {
      const d = new Date(iso)
      return d.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
    } catch { return '—' }
  }

  return (
    <div className="parsing-page">
      <div className="page-header">
        <h1 className="page-title">AI资料识别</h1>
        <div className="header-actions">
          <button
            className="btn btn-outline"
            disabled={batchConfirming || selected.size === 0}
            onClick={handleBatchConfirm}
          >
            {batchConfirming ? '确认中...' : `✓ 批量确认${selected.size > 0 ? `（${selected.size}）` : ''}`}
          </button>
          <button className="btn btn-primary" onClick={() => setShowUpload(true)}>↑ 上传文件</button>
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
          {STATUS_FILTER_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        <input
          className="search-input"
          placeholder="搜索客户名称..."
          value={customerSearch}
          onChange={e => setCustomerSearch(e.target.value)}
        />
        <div className="toolbar-spacer" />
        <span className="file-count">共 {total} 个文件</span>
      </div>

      <div className="card table-card">
        {loading ? (
          <Spinner />
        ) : err ? (
          <div className="error-box" style={{ margin: 16 }}>
            ⚠ {err}
            <button className="btn btn-outline" style={{ marginLeft: 12 }} onClick={load}>重试</button>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: 40 }}>
                  <input type="checkbox" checked={allSelected} onChange={toggleSelectAll} />
                </th>
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
              {filtered.map((d) => {
                const st = parseStatusInfo(d.aiParseStatus)
                const isPending = d.aiParseStatus === 'PENDING' || d.aiParseStatus === 'PROCESSING'
                const isDone = d.aiParseStatus === 'DONE'
                const isFailed = d.aiParseStatus === 'FAILED'
                return (
                  <tr key={d.id} className="table-row">
                    <td>
                      <input
                        type="checkbox"
                        checked={selected.has(d.id)}
                        onChange={() => toggleSelect(d.id)}
                      />
                    </td>
                    <td>
                      <div className="file-name-cell">
                        <span className="file-icon">{d.mimeType?.includes('pdf') ? '📄' : '🖼️'}</span>
                        <a className="cell-main doc-link" href={d.fileUrl} target="_blank" rel="noreferrer">
                          {d.fileName}
                        </a>
                      </div>
                    </td>
                    <td className="cell-sub">
                      {d.uploaderName ?? (d.uploaderType === 'customer' ? 'C端客户' : '顾问')}
                    </td>
                    <td>{d.customerName ?? `客户 #${d.customerId}`}</td>
                    <td>
                      <span className={`ai-type-tag ${d.aiDocType ? 'type-known' : 'type-unknown'}`}>
                        {d.aiDocType ? (DOC_TYPE_LABEL[d.aiDocType] ?? d.aiDocType) : '未知'}
                      </span>
                    </td>
                    <td><ConfBadge conf={d.confidence} /></td>
                    <td>
                      <span className="badge" style={{ background: st.bg, color: st.text }}>{st.label}</span>
                    </td>
                    <td className="cell-sub">{formatDate(d.createdAt)}</td>
                    <td>
                      <div className="action-btns">
                        {isPending && (
                          <>
                            <button className="btn-sm btn-confirm" onClick={() => handleConfirm(d)}>确认</button>
                            <button className="btn-sm btn-edit" onClick={() => setReclassifyDoc(d)}>修正</button>
                          </>
                        )}
                        {isDone && (
                          <button className="btn-sm btn-view" onClick={() => setReclassifyDoc(d)}>重新分类</button>
                        )}
                        {isFailed && (
                          <>
                            <button className="btn-sm btn-retry" onClick={() => handleRetry(d)}>重新识别</button>
                            <button className="btn-sm btn-edit" onClick={() => setReclassifyDoc(d)}>人工标注</button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
        {!loading && !err && filtered.length === 0 && (
          <div className="empty-state">没有匹配的文件记录</div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="pagination">
          <button className="page-btn" disabled={page === 1} onClick={() => setPage(p => p - 1)}>上一页</button>
          <span className="page-info">{page} / {totalPages}</span>
          <button className="page-btn" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>下一页</button>
        </div>
      )}

      {reclassifyDoc && (
        <ReclassifyModal
          doc={reclassifyDoc}
          onDone={handleReclassified}
          onClose={() => setReclassifyDoc(null)}
        />
      )}
      {showUpload && (
        <UploadModal
          onDone={() => { setShowUpload(false); load() }}
          onClose={() => setShowUpload(false)}
        />
      )}
    </div>
  )
}
