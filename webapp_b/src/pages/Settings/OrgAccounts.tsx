import { mockAccounts } from '../../utils/mock'
import './Settings.css'

function RoleBadge({ role }: { role: string }) {
  const map: Record<string, { bg: string; text: string }> = {
    '主管': { bg: '#fdf4ff', text: '#9333ea' },
    '顾问': { bg: '#eff6ff', text: '#2563eb' },
    '运营管理员': { bg: '#fffbeb', text: '#d97706' },
  }
  const c = map[role] || { bg: '#f8fafc', text: '#64748b' }
  return <span className="badge" style={{ background: c.bg, color: c.text }}>{role}</span>
}

function ScopeBadge({ scope }: { scope: string }) {
  const map: Record<string, { bg: string; text: string }> = {
    '仅本人客户': { bg: '#f8fafc', text: '#64748b' },
    '本团队客户': { bg: '#f0fdf4', text: '#16a34a' },
    '全部客户': { bg: '#eff6ff', text: '#2563eb' },
  }
  const c = map[scope] || { bg: '#f8fafc', text: '#64748b' }
  return <span className="badge" style={{ background: c.bg, color: c.text }}>{scope}</span>
}

export default function OrgAccounts() {
  const metrics = [
    { label: '员工账号', value: 4, color: '#0f172a', bg: '#f8fafc' },
    { label: '启用中', value: 3, color: '#16a34a', bg: '#f0fdf4' },
    { label: '顾问角色', value: 2, color: '#2563eb', bg: '#eff6ff' },
    { label: '停用账号', value: 1, color: '#dc2626', bg: '#fef2f2' },
  ]

  return (
    <div className="settings-page">
      <div className="page-header">
        <h1 className="page-title">机构账号</h1>
        <button className="btn btn-primary">+ 新增账号</button>
      </div>

      <div className="metrics-grid-4">
        {metrics.map((m) => (
          <div key={m.label} className="metric-card" style={{ borderTop: `3px solid ${m.color}`, background: m.bg }}>
            <div className="metric-value" style={{ color: m.color }}>{m.value}</div>
            <div className="metric-label">{m.label}</div>
            <div className="metric-desc">机构账号统计</div>
          </div>
        ))}
      </div>

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
            {mockAccounts.map((acc) => (
              <tr key={acc.id} className={acc.status === '停用' ? 'row-disabled' : ''}>
                <td>
                  <div className="account-name-cell">
                    <div className="account-avatar" style={{ opacity: acc.status === '停用' ? 0.4 : 1 }}>
                      {acc.name[0]}
                    </div>
                    <div>
                      <div className="cell-main" style={{ color: acc.status === '停用' ? '#94a3b8' : undefined }}>
                        {acc.name}
                      </div>
                      <div className="cell-sub">ID: {acc.id}</div>
                    </div>
                  </div>
                </td>
                <td><RoleBadge role={acc.role} /></td>
                <td><ScopeBadge scope={acc.scope} /></td>
                <td>
                  <span className={`badge ${acc.status === '启用' ? 'badge-active' : 'badge-inactive'}`}>
                    {acc.status}
                  </span>
                </td>
                <td className="cell-sub">{acc.last}</td>
                <td>
                  <div className="perm-list">
                    {acc.perms.slice(0, 3).map((p) => (
                      <span key={p} className="perm-chip">✓ {p}</span>
                    ))}
                    {acc.perms.length > 3 && (
                      <span className="perm-more">+{acc.perms.length - 3}</span>
                    )}
                  </div>
                </td>
                <td>
                  <div className="action-btns">
                    <button className="btn-sm btn-perm">权限</button>
                    <button className="btn-sm btn-toggle">
                      {acc.status === '启用' ? '停用' : '启用'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <style>{`
        .account-name-cell { display: flex; align-items: center; gap: 10px; }
        .account-avatar {
          width: 32px; height: 32px; background: #2563eb; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          color: white; font-size: 13px; font-weight: 600; flex-shrink: 0;
        }
        .row-disabled td { opacity: 0.6; }
        .perm-more {
          padding: 1px 6px; background: #f1f5f9; color: #64748b; border-radius: 4px;
          font-size: 11px; font-weight: 600;
        }
      `}</style>
    </div>
  )
}
