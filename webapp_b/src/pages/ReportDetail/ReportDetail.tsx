import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getReportTask, getReportFields, reviewField, exportReport, listDocuments, ApiReportTask, ApiFieldDraft, ApiDocument, ReviewFieldBody } from '../../utils/api'
import './ReportDetail.css'

const DOC_TYPE_LABEL: Record<string, string> = {
  BUSINESS_LICENSE: '营业执照', BANK_STATEMENT: '银行流水', CREDIT_REPORT: '征信报告',
  TAX_INVOICE: '税票', PROPERTY_CERT: '不动产证', ID_CARD: '身份证',
  FINANCIAL_STATEMENT: '财务报表', OTHER: '其他材料',
}

const DOC_PARSE_STYLE: Record<string, { bg: string; text: string; label: string }> = {
  PENDING:    { bg: '#f8fafc', text: '#64748b', label: '待解析' },
  PROCESSING: { bg: '#eff6ff', text: '#2563eb', label: '解析中' },
  DONE:       { bg: '#f0fdf4', text: '#16a34a', label: '已完成' },
  FAILED:     { bg: '#fef2f2', text: '#dc2626', label: '解析失败' },
}

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

const AI_STATUS_MAP: Record<string, { label: string; cls: string }> = {
  ok:           { label: '正常',   cls: 'badge-ok' },
  issue:        { label: '有问题', cls: 'badge-error' },
  missing:      { label: '缺失',   cls: 'badge-warn' },
  needs_review: { label: '待确认', cls: 'badge-warn' },
}

const REVIEW_STATUS_MAP: Record<string, { label: string; cls: string }> = {
  pending:   { label: '待审核', cls: 'badge-neutral' },
  approved:  { label: '已通过', cls: 'badge-ok' },
  corrected: { label: '已修正', cls: 'badge-info' },
  rejected:  { label: '已拒绝', cls: 'badge-error' },
}

function StatusBadge({ status }: { status: string }) {
  const c = STATUS_MAP[status] || { label: status, bg: '#f8fafc', text: '#64748b' }
  return <span className="badge" style={{ background: c.bg, color: c.text }}>{c.label}</span>
}

function Spinner() {
  return <div className="spinner-wrap"><div className="spinner" /></div>
}

interface CorrectModalProps {
  field: ApiFieldDraft
  taskId: string
  onDone: (updated: ApiFieldDraft) => void
  onClose: () => void
}

function CorrectModal({ field, taskId, onDone, onClose }: CorrectModalProps) {
  const [value, setValue] = useState(field.final_value ?? field.ai_value ?? '')
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')

  async function handleSave() {
    setLoading(true)
    setErr('')
    try {
      const body: ReviewFieldBody = { fieldId: field.id, reviewStatus: 'corrected', finalValue: value, reviewNote: note || undefined }
      const updated = await reviewField(taskId, body)
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
          <span className="modal-title">修正字段：{field.field_label}</span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="correct-ai-hint">
            <span className="correct-ai-label">AI填写值：</span>
            <span className="correct-ai-value">{field.ai_value || '（未填写）'}</span>
          </div>
          <div className="form-field">
            <label className="form-label">修正为<span className="required">*</span></label>
            <input className="form-input" value={value} onChange={e => setValue(e.target.value)} />
          </div>
          <div className="form-field">
            <label className="form-label">备注（选填）</label>
            <input className="form-input" value={note} onChange={e => setNote(e.target.value)} placeholder="说明修正原因..." />
          </div>
          {err && <div className="form-error">{err}</div>}
        </div>
        <div className="modal-footer">
          <button className="btn btn-outline" onClick={onClose}>取消</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={loading || !value.trim()}>
            {loading ? '保存中...' : '确认修正'}
          </button>
        </div>
      </div>
    </div>
  )
}

const TABS = ['复核总览', '字段明细', '材料目录']

// ─── Tab 2: 材料目录 ──────────────────────────────────────────────────────────

function MaterialsTab({ customerId, customerName }: { customerId: number; customerName: string }) {
  const navigate = useNavigate()
  const [docs, setDocs] = useState<ApiDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    listDocuments(customerId)
      .then(d => { setDocs(d); setLoading(false) })
      .catch(e => { setError(e instanceof Error ? e.message : '加载失败'); setLoading(false) })
  }, [customerId])

  if (loading) return <Spinner />
  if (error) return (
    <div className="error-box" style={{ marginTop: 8 }}>
      ⚠ {error}
      <button className="btn btn-outline" style={{ marginLeft: 12 }}
        onClick={() => { setLoading(true); setError(''); listDocuments(customerId).then(d => setDocs(d)).catch(e => setError(e instanceof Error ? e.message : '加载失败')).finally(() => setLoading(false)) }}>
        重试
      </button>
    </div>
  )

  // Group by docType
  const groups = docs.reduce<Record<string, ApiDocument[]>>((acc, d) => {
    const key = d.docType
    if (!acc[key]) acc[key] = []
    acc[key].push(d)
    return acc
  }, {})

  const typeOrder = ['BUSINESS_LICENSE', 'ID_CARD', 'CREDIT_REPORT', 'BANK_STATEMENT', 'TAX_INVOICE', 'FINANCIAL_STATEMENT', 'PROPERTY_CERT', 'OTHER']
  const sortedTypes = [...typeOrder.filter(t => groups[t]), ...Object.keys(groups).filter(t => !typeOrder.includes(t))]

  return (
    <div className="tab-content">
      <div className="materials-header">
        <div className="materials-summary">
          共 <strong>{docs.length}</strong> 份材料 · {Object.keys(groups).length} 种类型
        </div>
        <button className="btn btn-outline" onClick={() => navigate(`/customers/${customerId}?tab=1`)}>
          📎 前往上传材料
        </button>
      </div>

      {docs.length === 0 && (
        <div className="empty-state" style={{ marginTop: 24 }}>
          暂无上传材料，请前往客户详情页上传
          <br />
          <button className="btn btn-primary" style={{ marginTop: 12 }}
            onClick={() => navigate(`/customers/${customerId}?tab=1`)}>
            前往上传
          </button>
        </div>
      )}

      {sortedTypes.map(type => (
        <div key={type} className="materials-group card">
          <div className="materials-group-header">
            <span className="materials-group-title">{DOC_TYPE_LABEL[type] ?? type}</span>
            <span className="materials-group-count">{groups[type].length} 份</span>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>文件名</th>
                <th>上传方</th>
                <th>AI解析</th>
                <th>上传时间</th>
              </tr>
            </thead>
            <tbody>
              {groups[type].map(d => {
                const ps = DOC_PARSE_STYLE[d.aiParseStatus] ?? DOC_PARSE_STYLE['PENDING']
                return (
                  <tr key={d.id}>
                    <td>
                      <a className="doc-link" href={d.fileUrl} target="_blank" rel="noreferrer">
                        {d.fileName}
                      </a>
                      {d.fileSize ? <span className="cell-sub"> · {formatFileSize(d.fileSize)}</span> : null}
                    </td>
                    <td><span className="cell-sub">{d.uploaderType === 'customer' ? 'C端客户' : '顾问'}</span></td>
                    <td>
                      <span className="badge" style={{ background: ps.bg, color: ps.text }}>
                        {ps.label}
                      </span>
                    </td>
                    <td><span className="cell-sub">{formatUploadDate(d.createdAt)}</span></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ))}

      <div className="materials-footer-note">
        客户：{customerName} · 材料由顾问或客户通过C端小程序上传
      </div>
    </div>
  )
}

function formatFileSize(b: number): string {
  if (b < 1024) return `${b} B`
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`
  return `${(b / 1024 / 1024).toFixed(1)} MB`
}

function formatUploadDate(iso: string): string {
  try {
    const d = new Date(iso)
    return d.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
  } catch { return '—' }
}

export default function ReportDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [task, setTask] = useState<ApiReportTask | null>(null)
  const [fields, setFields] = useState<ApiFieldDraft[]>([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')
  const [activeTab, setActiveTab] = useState(0)
  const [correctField, setCorrectField] = useState<ApiFieldDraft | null>(null)
  const [exporting, setExporting] = useState(false)

  const load = useCallback(async () => {
    if (!id) return
    setLoading(true)
    setErr('')
    try {
      const [t, f] = await Promise.all([getReportTask(id), getReportFields(id)])
      setTask(t)
      setFields(f)
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : '加载失败')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { load() }, [load])

  async function handleReview(field: ApiFieldDraft, status: 'approved' | 'rejected') {
    if (!id) return
    try {
      const updated = await reviewField(id, { fieldId: field.id, reviewStatus: status })
      setFields(prev => prev.map(f => f.id === updated.id ? updated : f))
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : '操作失败')
    }
  }

  function handleCorrected(updated: ApiFieldDraft) {
    setFields(prev => prev.map(f => f.id === updated.id ? updated : f))
    setCorrectField(null)
  }

  async function handleExport() {
    if (!id || !task) return
    setExporting(true)
    try {
      const updated = await exportReport(id)
      setTask(updated)
      if (updated.export_url) {
        window.open(updated.export_url, '_blank')
      }
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : '导出失败')
    } finally {
      setExporting(false)
    }
  }

  if (loading) return <div className="report-detail"><Spinner /></div>
  if (err || !task) return (
    <div className="report-detail">
      <div className="error-box">{err || '任务不存在'}</div>
      <button className="btn btn-outline" onClick={load} style={{ marginTop: 12 }}>重试</button>
    </div>
  )

  const approved = fields.filter(f => f.review_status === 'approved' || f.review_status === 'corrected').length
  const pending = fields.filter(f => f.review_status === 'pending').length
  const issues = fields.filter(f => f.ai_status === 'issue' || f.ai_status === 'missing').length
  const canExport = task.status === 'REVIEW_DONE' || task.status === 'EXPORTED'

  return (
    <div className="report-detail">
      <div className="detail-header">
        <button className="back-btn" onClick={() => navigate('/reports')}>← 返回作业台</button>
        <div className="detail-breadcrumb">
          报告作业台 › <span>{task.customer_name}</span> › <span>{task.bank_short_name} · {task.product_name}</span>
        </div>
      </div>

      <div className="task-header card">
        <div className="task-header-main">
          <div className="task-id">作业 #{task.id}</div>
          <h2 className="task-customer">{task.customer_name}</h2>
          <div className="task-meta">
            {task.bank_short_name} · {task.product_name}
            {task.advisor_name ? ` · 处理人：${task.advisor_name}` : ''}
          </div>
        </div>
        <div className="task-header-side">
          <StatusBadge status={task.status} />
          <div className="fill-progress-info">
            <div className="fill-progress-nums">{approved} / {fields.length} 字段已审核</div>
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{
                  width: fields.length ? `${Math.round(approved / fields.length * 100)}%` : '0%',
                  background: approved === fields.length && fields.length > 0 ? '#16a34a' : '#2563eb',
                }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="tabs">
        {TABS.map((tab, i) => (
          <button
            key={tab}
            className={`tab-btn ${activeTab === i ? 'tab-btn-active' : ''}`}
            onClick={() => setActiveTab(i)}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab 0: 复核总览 */}
      {activeTab === 0 && (
        <div className="tab-content">
          <div className="principle-box card">
            <h3 className="principle-title">AI复核说明</h3>
            <p className="principle-text">
              AI已自动核查所有已填写字段。「已通过」字段置信度较高，已完成数据来源溯源；
              「有问题」或「缺失」字段需顾问人工干预；所有AI生成结果须经顾问审核后方可导出，
              平台不承担因未经复核导致的申请风险。
            </p>
          </div>

          <div className="review-metrics">
            <div className="review-metric review-pass">
              <div className="review-metric-num">{approved}</div>
              <div className="review-metric-label">已审核</div>
            </div>
            <div className="review-metric review-confirm">
              <div className="review-metric-num">{pending}</div>
              <div className="review-metric-label">待审核</div>
            </div>
            <div className="review-metric review-issue">
              <div className="review-metric-num">{issues}</div>
              <div className="review-metric-label">AI问题</div>
            </div>
          </div>

          <div className="review-actions">
            <button className="btn btn-outline" onClick={() => setActiveTab(1)}>查看字段明细</button>
            <button
              className="btn btn-export-big"
              disabled={!canExport || exporting}
              onClick={handleExport}
            >
              {exporting ? '导出中...' : '📦 导出材料包（ZIP）'}
            </button>
          </div>

          {task.export_url && (
            <div className="export-link-row">
              <span className="export-link-label">已导出文件：</span>
              <a href={task.export_url} target="_blank" rel="noreferrer" className="export-link">{task.export_url}</a>
            </div>
          )}
        </div>
      )}

      {/* Tab 1: 字段明细 */}
      {activeTab === 1 && (
        <div className="tab-content">
          <div className="card table-card">
            <table className="data-table">
              <thead>
                <tr>
                  <th>字段名</th>
                  <th>AI填写值</th>
                  <th>最终值</th>
                  <th>数据来源</th>
                  <th>AI状态</th>
                  <th>审核状态</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {fields.map(f => {
                  const ai = AI_STATUS_MAP[f.ai_status] || { label: f.ai_status, cls: 'badge-neutral' }
                  const rv = REVIEW_STATUS_MAP[f.review_status] || { label: f.review_status, cls: 'badge-neutral' }
                  const reviewed = f.review_status !== 'pending'
                  return (
                    <tr key={f.id}>
                      <td className="cell-main">{f.field_label}</td>
                      <td className={f.ai_status === 'missing' ? 'text-red' : ''}>{f.ai_value || '—'}</td>
                      <td>{f.final_value || f.ai_value || '—'}</td>
                      <td className="cell-sub">{f.source_hint || '—'}</td>
                      <td>
                        <span className={`badge ${ai.cls}`}>{ai.label}</span>
                        {f.ai_note && <div className="field-ai-note">{f.ai_note}</div>}
                      </td>
                      <td><span className={`badge ${rv.cls}`}>{rv.label}</span></td>
                      <td>
                        {!reviewed ? (
                          <div className="action-btns">
                            <button className="btn-sm btn-ok" onClick={() => handleReview(f, 'approved')}>通过</button>
                            <button className="btn-sm btn-correct" onClick={() => setCorrectField(f)}>修正</button>
                            <button className="btn-sm btn-reject" onClick={() => handleReview(f, 'rejected')}>拒绝</button>
                          </div>
                        ) : (
                          <button className="btn-sm btn-view" onClick={() => setCorrectField(f)}>修改</button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {fields.length === 0 && <div className="empty-state">暂无字段数据</div>}
          </div>
        </div>
      )}

      {/* Tab 2: 材料目录 */}
      {activeTab === 2 && task && (
        <MaterialsTab customerId={task.customer_id} customerName={task.customer_name} />
      )}

      <div className="report-footer">
        <div className="footer-info">
          <span>共 {fields.length} 个字段</span>
          <span className="sep">·</span>
          <span className="text-green">{approved} 已审核</span>
          <span className="sep">·</span>
          <span className="text-red">{pending} 待审核</span>
        </div>
        <button
          className="btn btn-export-big"
          disabled={!canExport || exporting}
          onClick={handleExport}
        >
          {exporting ? '导出中...' : '📦 导出材料包（ZIP）'}
        </button>
      </div>

      {correctField && (
        <CorrectModal
          field={correctField}
          taskId={id!}
          onDone={handleCorrected}
          onClose={() => setCorrectField(null)}
        />
      )}
    </div>
  )
}
