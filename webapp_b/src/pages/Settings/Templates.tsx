import { useState, useEffect, useCallback } from 'react'
import {
  listAiRules, createAiRule, updateAiRule, toggleAiRule,
  listPromptConfigs, updatePromptConfig,
  ApiAiRule, ApiPromptConfig,
} from '../../utils/api'
import './Settings.css'

const PRIORITY_MAP: Record<string, { label: string; cls: string }> = {
  HIGH:   { label: '高', cls: 'priority-高' },
  MEDIUM: { label: '中', cls: 'priority-中' },
  LOW:    { label: '低', cls: 'priority-低' },
}

function Spinner() {
  return <div className="spinner-wrap"><div className="spinner" /></div>
}

// ─── 新增/编辑规则弹窗 ────────────────────────────────────────────────────────

interface RuleModalProps {
  rule?: ApiAiRule
  onClose: () => void
  onSaved: (rule: ApiAiRule) => void
}

function RuleModal({ rule, onClose, onSaved }: RuleModalProps) {
  const [name, setName] = useState(rule?.name ?? '')
  const [fields, setFields] = useState(rule?.fields ?? '')
  const [trigger, setTrigger] = useState(rule?.trigger ?? '')
  const [priority, setPriority] = useState<'HIGH' | 'MEDIUM' | 'LOW'>(rule?.priority ?? 'MEDIUM')
  const [description, setDescription] = useState(rule?.description ?? '')
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')

  async function handleSave() {
    if (!name.trim() || !fields.trim() || !trigger.trim()) { setErr('名称、覆盖字段、触发条件为必填项'); return }
    setLoading(true)
    setErr('')
    try {
      const body = { name: name.trim(), fields: fields.trim(), trigger: trigger.trim(), priority, description: description || undefined }
      const saved = rule ? await updateAiRule(rule.id, body) : await createAiRule(body)
      onSaved(saved)
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : '保存失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-mask" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">{rule ? '编辑规则' : '新增AI填表规则'}</span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="form-field">
            <label className="form-label">规则名称<span className="required">*</span></label>
            <input className="form-input" value={name} onChange={e => setName(e.target.value)} placeholder="如：营业执照自动识别" />
          </div>
          <div className="form-field">
            <label className="form-label">覆盖字段<span className="required">*</span></label>
            <input className="form-input" value={fields} onChange={e => setFields(e.target.value)} placeholder="如：企业名称/注册资本/成立日期" />
          </div>
          <div className="form-field">
            <label className="form-label">触发条件<span className="required">*</span></label>
            <input className="form-input" value={trigger} onChange={e => setTrigger(e.target.value)} placeholder="如：上传营业执照时" />
          </div>
          <div className="form-field">
            <label className="form-label">优先级</label>
            <select className="form-select" value={priority} onChange={e => setPriority(e.target.value as 'HIGH' | 'MEDIUM' | 'LOW')}>
              <option value="HIGH">高</option>
              <option value="MEDIUM">中</option>
              <option value="LOW">低</option>
            </select>
          </div>
          <div className="form-field">
            <label className="form-label">规则说明</label>
            <textarea className="form-textarea" value={description} onChange={e => setDescription(e.target.value)} placeholder="规则的详细说明..." rows={2} />
          </div>
          {err && <div className="form-error">{err}</div>}
        </div>
        <div className="modal-footer">
          <button className="btn btn-outline" onClick={onClose}>取消</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={loading}>
            {loading ? '保存中...' : '保存规则'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── 编辑 Prompt 弹窗 ─────────────────────────────────────────────────────────

interface PromptModalProps {
  config: ApiPromptConfig
  onClose: () => void
  onSaved: (config: ApiPromptConfig) => void
}

function PromptModal({ config, onClose, onSaved }: PromptModalProps) {
  const [prompt, setPrompt] = useState(config.prompt)
  const [model, setModel] = useState(config.model)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')

  async function handleSave() {
    if (!prompt.trim()) { setErr('Prompt 内容不能为空'); return }
    setLoading(true)
    setErr('')
    try {
      const saved = await updatePromptConfig(config.id, { prompt: prompt.trim(), model: model || undefined })
      onSaved(saved)
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : '保存失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-mask" onClick={onClose}>
      <div className="modal-box modal-box-lg" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">{config.icon} 编辑 Prompt · {config.type}</span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="form-field">
            <label className="form-label">AI模型</label>
            <input className="form-input" value={model} onChange={e => setModel(e.target.value)} placeholder="如：GPT-4o" />
          </div>
          <div className="form-field">
            <label className="form-label">Prompt 内容<span className="required">*</span></label>
            <textarea
              className="form-textarea prompt-textarea"
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              rows={10}
              placeholder="输入 Prompt 指令..."
            />
          </div>
          {err && <div className="form-error">{err}</div>}
        </div>
        <div className="modal-footer">
          <button className="btn btn-outline" onClick={onClose}>取消</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={loading}>
            {loading ? '保存中...' : '保存 Prompt'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── 主页面 ────────────────────────────────────────────────────────────────────

export default function Templates() {
  const [rules, setRules] = useState<ApiAiRule[]>([])
  const [prompts, setPrompts] = useState<ApiPromptConfig[]>([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')
  const [editRule, setEditRule] = useState<ApiAiRule | undefined>(undefined)
  const [showNewRule, setShowNewRule] = useState(false)
  const [editPrompt, setEditPrompt] = useState<ApiPromptConfig | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setErr('')
    try {
      const [ruleList, promptList] = await Promise.all([listAiRules(), listPromptConfigs()])
      setRules(ruleList)
      setPrompts(promptList)
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : '加载失败')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  async function handleToggle(rule: ApiAiRule) {
    try {
      const updated = await toggleAiRule(rule.id)
      setRules(prev => prev.map(r => r.id === updated.id ? updated : r))
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : '操作失败')
    }
  }

  function handleRuleSaved(saved: ApiAiRule) {
    setRules(prev => {
      const idx = prev.findIndex(r => r.id === saved.id)
      if (idx >= 0) { const next = [...prev]; next[idx] = saved; return next }
      return [...prev, saved]
    })
    setEditRule(undefined)
    setShowNewRule(false)
  }

  function handlePromptSaved(saved: ApiPromptConfig) {
    setPrompts(prev => prev.map(p => p.id === saved.id ? saved : p))
    setEditPrompt(null)
  }

  const enabledRules = rules.filter(r => r.status === 'ENABLED').length

  return (
    <div className="settings-page">
      <div className="page-header">
        <h1 className="page-title">平台配置</h1>
      </div>

      <div className="metrics-grid-4">
        <div className="metric-card" style={{ borderTop: '3px solid #2563eb' }}>
          <div className="metric-value" style={{ color: '#2563eb' }}>{rules.length}</div>
          <div className="metric-label">AI填表规则</div>
          <div className="metric-desc">{enabledRules} 条启用中</div>
        </div>
        <div className="metric-card" style={{ borderTop: '3px solid #16a34a' }}>
          <div className="metric-value" style={{ color: '#16a34a' }}>{prompts.length}</div>
          <div className="metric-label">Prompt配置</div>
          <div className="metric-desc">{prompts.filter(p => p.status === 'ENABLED').length} 条已启用</div>
        </div>
        <div className="metric-card" style={{ borderTop: '3px solid #d97706' }}>
          <div className="metric-value" style={{ color: '#d97706' }}>{rules.filter(r => r.priority === 'HIGH').length}</div>
          <div className="metric-label">高优先级规则</div>
          <div className="metric-desc">优先执行</div>
        </div>
        <div className="metric-card" style={{ borderTop: '3px solid #9333ea' }}>
          <div className="metric-value" style={{ color: '#9333ea' }}>已开启</div>
          <div className="metric-label">机构私有化配置</div>
          <div className="metric-desc">独立 Prompt & 规则</div>
        </div>
      </div>

      {loading ? <Spinner /> : err ? (
        <div className="error-box">⚠ {err} <button className="btn btn-outline" style={{ marginLeft: 12 }} onClick={load}>重试</button></div>
      ) : (
        <>
          {/* AI Rules */}
          <div className="section">
            <div className="section-header">
              <h2 className="section-title">AI填表规则</h2>
              <button className="btn btn-primary" style={{ marginLeft: 'auto' }} onClick={() => setShowNewRule(true)}>+ 新增规则</button>
            </div>
            <div className="card table-card">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>规则名称</th>
                    <th>覆盖字段</th>
                    <th>触发条件</th>
                    <th>优先级</th>
                    <th>状态</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {rules.map(rule => {
                    const p = PRIORITY_MAP[rule.priority] ?? { label: rule.priority, cls: '' }
                    return (
                      <tr key={rule.id}>
                        <td>
                          <div className="cell-main">{rule.name}</div>
                          {rule.description && <div className="cell-sub">{rule.description}</div>}
                        </td>
                        <td className="cell-sub">{rule.fields}</td>
                        <td className="cell-sub">{rule.trigger}</td>
                        <td><span className={`priority-badge ${p.cls}`}>{p.label}</span></td>
                        <td>
                          <span className={`badge ${rule.status === 'ENABLED' ? 'badge-active' : 'badge-inactive'}`}>
                            {rule.status === 'ENABLED' ? '启用' : '停用'}
                          </span>
                        </td>
                        <td>
                          <div className="action-btns">
                            <button className="btn-sm btn-edit" onClick={() => setEditRule(rule)}>编辑</button>
                            <button className="btn-sm btn-toggle" onClick={() => handleToggle(rule)}>
                              {rule.status === 'ENABLED' ? '停用' : '启用'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              {rules.length === 0 && <div className="empty-state">暂无规则，点击"新增规则"添加</div>}
            </div>
          </div>

          {/* Prompt configs */}
          <div className="section">
            <div className="section-header">
              <h2 className="section-title">Prompt 配置</h2>
              <span className="section-desc">机构可自定义 AI 指令以匹配业务场景</span>
            </div>
            <div className="prompt-grid">
              {prompts.map(pc => (
                <div key={pc.id} className="card prompt-card">
                  <div className="prompt-header">
                    <span className="prompt-icon">{pc.icon}</span>
                    <div>
                      <div className="prompt-type">{pc.type}</div>
                      <div className="prompt-model">模型：{pc.model}</div>
                    </div>
                    <span className={`badge ${pc.status === 'ENABLED' ? 'badge-active' : 'badge-inactive'}`} style={{ marginLeft: 'auto' }}>
                      {pc.status === 'ENABLED' ? '已启用' : '已停用'}
                    </span>
                  </div>
                  <div className="prompt-preview">{pc.prompt}</div>
                  <div className="prompt-footer">
                    <span className="prompt-date">最近更新：{pc.updatedAt?.slice(0, 10) ?? '—'}</span>
                    <button className="btn-sm btn-edit-prompt" onClick={() => setEditPrompt(pc)}>编辑 Prompt</button>
                  </div>
                </div>
              ))}
              {prompts.length === 0 && <div className="cell-sub">暂无 Prompt 配置</div>}
            </div>
          </div>
        </>
      )}

      {(showNewRule || editRule) && (
        <RuleModal
          rule={editRule}
          onClose={() => { setShowNewRule(false); setEditRule(undefined) }}
          onSaved={handleRuleSaved}
        />
      )}
      {editPrompt && (
        <PromptModal
          config={editPrompt}
          onClose={() => setEditPrompt(null)}
          onSaved={handlePromptSaved}
        />
      )}
    </div>
  )
}
