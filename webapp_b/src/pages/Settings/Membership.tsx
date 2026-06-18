import { useState, useEffect } from 'react'
import { getMembership, ApiMembership } from '../../utils/api'
import './Settings.css'

function Spinner() {
  return <div className="spinner-wrap"><div className="spinner" /></div>
}

function QuotaBar({ used, quota, color }: { used: number; quota: number; color: string }) {
  const pct = quota > 0 ? Math.min((used / quota) * 100, 100) : 0
  const warn = pct >= 80
  return (
    <div className="quota-bar-wrap">
      <div className="quota-bar">
        <div className="quota-fill" style={{ width: `${pct}%`, background: warn ? '#d97706' : color }} />
      </div>
      <div className="quota-text" style={{ color: warn ? '#d97706' : '#64748b' }}>
        已用 {used} / {quota === -1 ? '无限制' : quota}
      </div>
    </div>
  )
}

// ─── 升级套餐弹窗 ──────────────────────────────────────────────────────────────

function UpgradeModal({ onClose }: { onClose: () => void }) {
  const plans = [
    {
      name: 'Plus版', price: '¥599/月', current: false,
      features: ['客户档案 50个', 'AI识别 100次/月', 'AI填写 50次/月', '导出功能', '多账号（3人）'],
    },
    {
      name: '机构版', price: '¥2999/月', current: false,
      features: ['客户档案 无限制', 'AI识别 无限制', 'AI填写 500次/月', '导出功能', '多账号 无限制', 'API调用 500次/月'],
    },
  ]

  return (
    <div className="modal-mask" onClick={onClose}>
      <div className="modal-box modal-box-lg" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">升级套餐</span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="upgrade-plans">
            {plans.map(p => (
              <div key={p.name} className="upgrade-plan-card">
                <div className="upgrade-plan-name">{p.name}</div>
                <div className="upgrade-plan-price">{p.price}</div>
                <div className="upgrade-plan-features">
                  {p.features.map(f => (
                    <div key={f} className="plan-feature">
                      <span className="feature-check">✓</span>
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
                <button className="plan-btn plan-btn-upgrade" onClick={() => {
                  alert(`请联系客服升级至 ${p.name}，电话：400-xxx-xxxx`)
                  onClose()
                }}>
                  申请升级
                </button>
              </div>
            ))}
          </div>
          <div className="upgrade-note">如需定制方案或了解更多权益，请联系专属客户成功经理</div>
        </div>
      </div>
    </div>
  )
}

const PLAN_RIGHTS: Record<string, string[]> = {
  FREE: ['客户档案管理（5个）', 'AI资料识别（10次/月）'],
  PLUS: [
    '客户档案管理（50个）', 'AI资料识别（100次/月）',
    'AI自动填写表格（50次/月）', '材料包ZIP导出', '多账号（3人）',
  ],
  ENTERPRISE: [
    '无限客户档案管理', 'AI资料识别（无限制）', 'AI自动填写（500次/月）',
    '材料包ZIP导出', '机构子账号（无限制）', 'API调用（500次/月）',
    '自定义AI规则与Prompt', '机构私有化配置', '专属客户成功经理',
  ],
}

export default function Membership() {
  const [membership, setMembership] = useState<ApiMembership | null>(null)
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')
  const [showUpgrade, setShowUpgrade] = useState(false)

  useEffect(() => {
    getMembership()
      .then(setMembership)
      .catch(e => setErr(e instanceof Error ? e.message : '加载失败'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="settings-page"><Spinner /></div>

  // Fallback display when API not available
  const m = membership ?? {
    planName: '机构版', planCode: 'ENTERPRISE',
    expiresAt: '2027-06-17',
    reportQuota: 500, reportUsed: 53,
    packageQuota: 100, packageUsed: 11,
    apiQuota: 500, apiUsed: 4,
    employeeQuota: -1, employeeCount: 4,
  }

  const rights = PLAN_RIGHTS[m.planCode] ?? PLAN_RIGHTS['ENTERPRISE']
  const isEnterprise = m.planCode === 'ENTERPRISE'

  return (
    <div className="settings-page">
      <div className="page-header">
        <h1 className="page-title">会员与套餐</h1>
        {!isEnterprise && (
          <button className="btn btn-primary" onClick={() => setShowUpgrade(true)}>↑ 升级套餐</button>
        )}
      </div>

      {err && <div className="error-box" style={{ marginBottom: 20 }}>⚠ 套餐信息加载失败，显示默认数据</div>}

      <div className="metrics-grid-4">
        <div className="metric-card" style={{ borderTop: '3px solid #7c3aed' }}>
          <div className="metric-value" style={{ color: '#7c3aed' }}>{m.planName}</div>
          <div className="metric-label">当前套餐</div>
          <div className="metric-desc">{m.expiresAt ? `到期：${m.expiresAt.slice(0, 10)}` : '永久有效'}</div>
        </div>
        <div className="metric-card" style={{ borderTop: '3px solid #16a34a' }}>
          <div className="metric-value" style={{ color: '#16a34a' }}>{m.reportQuota === -1 ? '∞' : m.reportQuota - m.reportUsed}</div>
          <div className="metric-label">剩余AI报告次数</div>
          <div className="metric-desc">本月已用 {m.reportUsed} 次</div>
        </div>
        <div className="metric-card" style={{ borderTop: '3px solid #2563eb' }}>
          <div className="metric-value" style={{ color: '#2563eb' }}>{m.packageQuota === -1 ? '∞' : m.packageQuota - m.packageUsed}</div>
          <div className="metric-label">剩余材料整理次数</div>
          <div className="metric-desc">本月已用 {m.packageUsed} 次</div>
        </div>
        <div className="metric-card" style={{ borderTop: '3px solid #d97706' }}>
          <div className="metric-value" style={{ color: '#d97706' }}>{m.reportUsed + m.packageUsed + m.apiUsed}</div>
          <div className="metric-label">本月已用总次数</div>
          <div className="metric-desc">重置日：每月1日</div>
        </div>
      </div>

      {/* Quota details */}
      <div className="section">
        <div className="section-header">
          <h2 className="section-title">用量详情</h2>
        </div>
        <div className="card quota-grid">
          <div className="quota-item">
            <div className="quota-label">AI报告生成</div>
            <QuotaBar used={m.reportUsed} quota={m.reportQuota} color="#16a34a" />
          </div>
          <div className="quota-item">
            <div className="quota-label">材料整理</div>
            <QuotaBar used={m.packageUsed} quota={m.packageQuota} color="#2563eb" />
          </div>
          <div className="quota-item">
            <div className="quota-label">API调用</div>
            <QuotaBar used={m.apiUsed} quota={m.apiQuota} color="#9333ea" />
          </div>
          <div className="quota-item">
            <div className="quota-label">员工账号</div>
            <QuotaBar used={m.employeeCount} quota={m.employeeQuota} color="#0f172a" />
          </div>
        </div>
      </div>

      {/* Rights */}
      <div className="section">
        <div className="section-header">
          <h2 className="section-title">{m.planName}权益</h2>
        </div>
        <div className="card">
          <div className="rights-list">
            {rights.map(r => (
              <div key={r} className="rights-item">
                <span className="rights-check">✓</span>
                <span>{r}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Plan comparison */}
      <div className="section">
        <div className="section-header">
          <h2 className="section-title">套餐对比</h2>
        </div>
        <div className="plan-grid">
          {[
            { name: '免费版', price: '¥0', priceSub: '永久免费', code: 'FREE',
              features: [{ l: '客户档案 5个', ok: true }, { l: 'AI识别 10次/月', ok: true }, { l: 'AI填写', ok: false }, { l: '导出功能', ok: false }, { l: '多账号', ok: false }, { l: 'API调用', ok: false }] },
            { name: 'Plus版', price: '¥599', priceSub: '元/月', code: 'PLUS',
              features: [{ l: '客户档案 50个', ok: true }, { l: 'AI识别 100次/月', ok: true }, { l: 'AI填写 50次/月', ok: true }, { l: '导出功能', ok: true }, { l: '多账号（3人）', ok: true }, { l: 'API调用', ok: false }] },
            { name: '机构版', price: '¥2999', priceSub: '元/月', code: 'ENTERPRISE',
              features: [{ l: '客户档案 无限制', ok: true }, { l: 'AI识别 无限制', ok: true }, { l: 'AI填写 500次/月', ok: true }, { l: '导出功能', ok: true }, { l: '多账号 无限制', ok: true }, { l: 'API调用 500次/月', ok: true }] },
          ].map(plan => {
            const isCurrent = plan.code === m.planCode
            return (
              <div key={plan.name} className={`plan-card ${isCurrent ? 'plan-card-current' : ''}`}>
                {isCurrent && <div className="plan-current-tag">当前套餐</div>}
                <div className="plan-name">{plan.name}</div>
                <div className="plan-price">{plan.price}</div>
                <div className="plan-price-sub">{plan.priceSub}</div>
                <div className="plan-features">
                  {plan.features.map(f => (
                    <div key={f.l} className="plan-feature">
                      <span className={f.ok ? 'feature-check' : 'feature-no'}>{f.ok ? '✓' : '✗'}</span>
                      <span style={{ color: f.ok ? '#374151' : '#cbd5e1' }}>{f.l}</span>
                    </div>
                  ))}
                </div>
                <button
                  className={`plan-btn ${isCurrent ? 'plan-btn-current' : 'plan-btn-upgrade'}`}
                  onClick={isCurrent ? undefined : () => setShowUpgrade(true)}
                  disabled={isCurrent}
                >
                  {isCurrent ? '当前套餐' : `升级至${plan.name}`}
                </button>
              </div>
            )
          })}
        </div>
      </div>

      {showUpgrade && <UpgradeModal onClose={() => setShowUpgrade(false)} />}
    </div>
  )
}
