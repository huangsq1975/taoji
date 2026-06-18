import { useState, useEffect, useCallback } from 'react'
import { listOrgAccounts, createOrgAccount, toggleOrgAccount, updateOrgAccountPermissions, ApiOrgAccount } from '../../utils/api'
import './Settings.css'

const ROLES = [
  { value: 'ADVISOR', label: '顾问' },
  { value: 'MANAGER', label: '主管' },
  { value: 'ADMIN', label: '运营管理员' },
]

const DATA_SCOPES = [
  { value: 'SELF', label: '仅本人客户' },
  { value: 'TEAM', label: '本团队客户' },
  { value: 'ALL', label: '全部客户' },
]

const ALL_PERMISSIONS = [
  '查看客户', '编辑跟进', 'AI资料解析', '生成补件清单',
  '维护银行材料要求', '复核材料包', '会员套餐管理', '账号启停', '权限配置',
]

function roleLabel(role: string) {
  return ROLES.find(r => r.value === role)?.label ?? role
}
function scopeLabel(scope: string) {
  return DATA_SCOPES.find(s => s.value === scope)?.label ?? scope
}

function RoleBadge({ role }: { role: string }) {
  const map: Record<string, { bg: string; text: string }> = {
    MANAGER:  { bg: '#fdf4ff', text: '#9333ea' },
    ADVISOR:  { bg: '#eff6ff', text: '#2563eb' },
    ADMIN:    { bg: '#fffbeb', text: '#d97706' },
  }
  const c = map[role] || { bg: '#f8fafc', text: '#64748b' }
  return <span className="badge" style={{ background: c.bg, color: c.text }}>{roleLabel(role)}</span>
}

function ScopeBadge({ scope }: { scope: string }) {
  const map: Record<string, { bg: string; text: string }> = {
    SELF: { bg: '#f8fafc', text: '#64748b' },
    TEAM: { bg: '#f0fdf4', text: '#16a34a' },
    ALL:  { bg: '#eff6ff', text: '#2563eb' },
  }
  const c = map[scope] || { bg: '#f8fafc', text: '#64748b' }
  return <span className="badge" style={{ background: c.bg, color: c.text }}>{scopeLabel(scope)}</span>
}

function Spinner() {
  return <div className="spinner-wrap"><div className="spinner" /></div>
}

// ─── 新增账号弹窗 ──────────────────────────────────────────────────────────────

interface AddAccountModalProps {
  onClose: () => void
  onCreated: (acc: ApiOrgAccount) => void
}

function AddAccountModal({ onClose, onCreated }: AddAccountModalProps) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [role, setRole] = useState('ADVISOR')
  const [dataScope, setDataScope] = useState('SELF')
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')

  async function handleSubmit() {
    if (!name.trim() || !phone.trim()) { setErr('姓名和手机号为必填项'); return }
    setLoading(true)
    setErr('')
    try {
      const acc = await createOrgAccount({ name: name.trim(), phone: phone.trim(), role, dataScope })
      onCreated(acc)
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
          <span className="modal-title">新增员工账号</span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="form-row">
            <div className="form-field">
              <label className="form-label">姓名<span className="required">*</span></label>
              <input className="form-input" value={name} onChange={e => setName(e.target.value)} placeholder="员工姓名" />
            </div>
            <div className="form-field">
              <label className="form-label">手机号<span className="required">*</span></label>
              <input className="form-input" value={phone} onChange={e => setPhone(e.target.value)} placeholder="用于登录" />
            </div>
          </div>
          <div className="form-row">
            <div className="form-field">
              <label className="form-label">角色</label>
              <select className="form-select" value={role} onChange={e => setRole(e.target.value)}>
                {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>
            <div className="form-field">
              <label className="form-label">数据范围</label>
              <select className="form-select" value={dataScope} onChange={e => setDataScope(e.target.value)}>
                {DATA_SCOPES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
          </div>
          {err && <div className="form-error">{err}</div>}
        </div>
        <div className="modal-footer">
          <button className="btn btn-outline" onClick={onClose}>取消</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={loading || !name.trim() || !phone.trim()}>
            {loading ? '创建中...' : '创建账号'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── 权限配置弹窗 ──────────────────────────────────────────────────────────────

interface PermModalProps {
  acc: ApiOrgAccount
  onClose: () => void
  onSaved: (acc: ApiOrgAccount) => void
}

function PermModal({ acc, onClose, onSaved }: PermModalProps) {
  const [perms, setPerms] = useState<Set<string>>(new Set(acc.permissions))
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')

  function toggle(perm: string) {
    setPerms(prev => {
      const next = new Set(prev)
      if (next.has(perm)) next.delete(perm)
      else next.add(perm)
      return next
    })
  }

  async function handleSave() {
    setLoading(true)
    setErr('')
    try {
      const updated = await updateOrgAccountPermissions(acc.id, Array.from(perms))
      onSaved(updated)
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
          <span className="modal-title">权限配置 · {acc.name}</span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="hint-box">
            <span className="hint-label">角色：</span>
            <span>{roleLabel(acc.role)}</span>
            <span style={{ margin: '0 8px', color: '#cbd5e1' }}>·</span>
            <span className="hint-label">数据范围：</span>
            <span>{scopeLabel(acc.dataScope)}</span>
          </div>
          <div className="perm-grid">
            {ALL_PERMISSIONS.map(perm => (
              <label key={perm} className="perm-checkbox-item">
                <input
                  type="checkbox"
                  checked={perms.has(perm)}
                  onChange={() => toggle(perm)}
                />
                <span>{perm}</span>
              </label>
            ))}
          </div>
          {err && <div className="form-error">{err}</div>}
        </div>
        <div className="modal-footer">
          <button className="btn btn-outline" onClick={onClose}>取消</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={loading}>
            {loading ? '保存中...' : '保存权限'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── 主页面 ────────────────────────────────────────────────────────────────────

export default function OrgAccounts() {
  const [accounts, setAccounts] = useState<ApiOrgAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [permAcc, setPermAcc] = useState<ApiOrgAccount | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setErr('')
    try {
      setAccounts(await listOrgAccounts())
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : '加载失败')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  async function handleToggle(acc: ApiOrgAccount) {
    try {
      const updated = await toggleOrgAccount(acc.id)
      setAccounts(prev => prev.map(a => a.id === updated.id ? updated : a))
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : '操作失败')
    }
  }

  function handlePermSaved(updated: ApiOrgAccount) {
    setAccounts(prev => prev.map(a => a.id === updated.id ? updated : a))
    setPermAcc(null)
  }

  const activeCount = accounts.filter(a => a.status === 'ACTIVE').length
  const advisorCount = accounts.filter(a => a.role === 'ADVISOR').length
  const inactiveCount = accounts.filter(a => a.status === 'INACTIVE').length

  return (
    <div className="settings-page">
      <div className="page-header">
        <h1 className="page-title">机构账号</h1>
        <button className="btn btn-primary" onClick={() => setShowAdd(true)}>+ 新增账号</button>
      </div>

      <div className="metrics-grid-4">
        <div className="metric-card" style={{ borderTop: '3px solid #0f172a', background: '#f8fafc' }}>
          <div className="metric-value">{accounts.length}</div>
          <div className="metric-label">员工账号</div>
          <div className="metric-desc">机构成员总数</div>
        </div>
        <div className="metric-card" style={{ borderTop: '3px solid #16a34a', background: '#f0fdf4' }}>
          <div className="metric-value" style={{ color: '#16a34a' }}>{activeCount}</div>
          <div className="metric-label">启用中</div>
          <div className="metric-desc">可正常登录</div>
        </div>
        <div className="metric-card" style={{ borderTop: '3px solid #2563eb', background: '#eff6ff' }}>
          <div className="metric-value" style={{ color: '#2563eb' }}>{advisorCount}</div>
          <div className="metric-label">顾问角色</div>
          <div className="metric-desc">处理客户业务</div>
        </div>
        <div className="metric-card" style={{ borderTop: '3px solid #dc2626', background: '#fef2f2' }}>
          <div className="metric-value" style={{ color: '#dc2626' }}>{inactiveCount}</div>
          <div className="metric-label">停用账号</div>
          <div className="metric-desc">已禁止登录</div>
        </div>
      </div>

      {loading ? <Spinner /> : err ? (
        <div className="error-box">⚠ {err} <button className="btn btn-outline" style={{ marginLeft: 12 }} onClick={load}>重试</button></div>
      ) : (
        <div className="card table-card">
          <table className="data-table">
            <thead>
              <tr>
                <th>员工</th>
                <th>角色</th>
                <th>数据范围</th>
                <th>状态</th>
                <th>最近登录</th>
                <th>权限摘要</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {accounts.map(acc => (
                <tr key={acc.id} style={{ opacity: acc.status === 'INACTIVE' ? 0.6 : 1 }}>
                  <td>
                    <div className="account-name-cell">
                      <div className="account-avatar" style={{ opacity: acc.status === 'INACTIVE' ? 0.4 : 1 }}>
                        {acc.name[0]}
                      </div>
                      <div>
                        <div className="cell-main" style={{ color: acc.status === 'INACTIVE' ? '#94a3b8' : undefined }}>
                          {acc.name}
                        </div>
                        <div className="cell-sub">{acc.phone}</div>
                      </div>
                    </div>
                  </td>
                  <td><RoleBadge role={acc.role} /></td>
                  <td><ScopeBadge scope={acc.dataScope} /></td>
                  <td>
                    <span className={`badge ${acc.status === 'ACTIVE' ? 'badge-active' : 'badge-inactive'}`}>
                      {acc.status === 'ACTIVE' ? '启用' : '停用'}
                    </span>
                  </td>
                  <td className="cell-sub">{acc.lastLoginAt ? new Date(acc.lastLoginAt).toLocaleDateString('zh-CN') : '从未登录'}</td>
                  <td>
                    <div className="perm-list">
                      {acc.permissions.slice(0, 3).map(p => (
                        <span key={p} className="perm-chip">✓ {p}</span>
                      ))}
                      {acc.permissions.length > 3 && (
                        <span className="perm-more">+{acc.permissions.length - 3}</span>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="action-btns">
                      <button className="btn-sm btn-perm" onClick={() => setPermAcc(acc)}>权限</button>
                      <button className="btn-sm btn-toggle" onClick={() => handleToggle(acc)}>
                        {acc.status === 'ACTIVE' ? '停用' : '启用'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {accounts.length === 0 && <div className="empty-state">暂无账号，点击"新增账号"添加</div>}
        </div>
      )}

      {showAdd && <AddAccountModal onClose={() => setShowAdd(false)} onCreated={acc => { setAccounts(prev => [...prev, acc]); setShowAdd(false) }} />}
      {permAcc && <PermModal acc={permAcc} onClose={() => setPermAcc(null)} onSaved={handlePermSaved} />}
    </div>
  )
}
