import './Settings.css'

const rights = [
  '无限客户档案管理',
  'AI资料识别（含OCR）',
  '多银行产品资料配置',
  'AI自动填写银行表格',
  '顾问复核工作流',
  '材料包ZIP导出',
  '自定义AI规则与Prompt',
  '机构子账号管理',
  'API调用额度（500次/月）',
  '专属客户成功经理',
]

const plans = [
  {
    name: '免费版',
    price: '¥0',
    priceSub: '永久免费',
    current: false,
    features: [
      { label: '客户档案 5个', ok: true },
      { label: 'AI识别 10次/月', ok: true },
      { label: 'AI填写', ok: false },
      { label: '导出功能', ok: false },
      { label: '多账号', ok: false },
      { label: 'API调用', ok: false },
    ],
    btnLabel: '已使用过',
    btnClass: 'plan-btn-current',
  },
  {
    name: 'Plus版',
    price: '¥599',
    priceSub: '元/月',
    current: false,
    features: [
      { label: '客户档案 50个', ok: true },
      { label: 'AI识别 100次/月', ok: true },
      { label: 'AI填写 50次/月', ok: true },
      { label: '导出功能', ok: true },
      { label: '多账号（3人）', ok: true },
      { label: 'API调用', ok: false },
    ],
    btnLabel: '升级至Plus',
    btnClass: 'plan-btn-upgrade',
  },
  {
    name: '机构版',
    price: '¥2999',
    priceSub: '元/月',
    current: true,
    features: [
      { label: '客户档案 无限制', ok: true },
      { label: 'AI识别 无限制', ok: true },
      { label: 'AI填写 500次/月', ok: true },
      { label: '导出功能', ok: true },
      { label: '多账号 无限制', ok: true },
      { label: 'API调用 500次/月', ok: true },
    ],
    btnLabel: '当前套餐',
    btnClass: 'plan-btn-current',
  },
]

export default function Membership() {
  return (
    <div className="settings-page">
      <div className="page-header">
        <h1 className="page-title">会员与套餐</h1>
      </div>

      {/* Current plan metrics */}
      <div className="metrics-grid-4">
        <div className="metric-card" style={{ borderTop: '3px solid #7c3aed' }}>
          <div className="metric-value" style={{ color: '#7c3aed' }}>机构版</div>
          <div className="metric-label">当前套餐</div>
          <div className="metric-desc">到期：2027-06-17</div>
        </div>
        <div className="metric-card" style={{ borderTop: '3px solid #16a34a' }}>
          <div className="metric-value" style={{ color: '#16a34a' }}>247</div>
          <div className="metric-label">剩余AI报告次数</div>
          <div className="metric-desc">本月已用 53 次</div>
        </div>
        <div className="metric-card" style={{ borderTop: '3px solid #2563eb' }}>
          <div className="metric-value" style={{ color: '#2563eb' }}>89</div>
          <div className="metric-label">剩余材料整理次数</div>
          <div className="metric-desc">本月已用 11 次</div>
        </div>
        <div className="metric-card" style={{ borderTop: '3px solid #d97706' }}>
          <div className="metric-value" style={{ color: '#d97706' }}>53</div>
          <div className="metric-label">本月已用总次数</div>
          <div className="metric-desc">重置日：每月1日</div>
        </div>
      </div>

      {/* Rights */}
      <div className="section">
        <div className="section-header">
          <h2 className="section-title">机构版权益</h2>
        </div>
        <div className="card">
          <div className="rights-list">
            {rights.map((r) => (
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
          {plans.map((plan) => (
            <div key={plan.name} className={`plan-card ${plan.current ? 'plan-card-current' : ''}`}>
              {plan.current && <div className="plan-current-tag">当前套餐</div>}
              <div className="plan-name">{plan.name}</div>
              <div className="plan-price">{plan.price}</div>
              <div className="plan-price-sub">{plan.priceSub}</div>
              <div className="plan-features">
                {plan.features.map((f) => (
                  <div key={f.label} className="plan-feature">
                    <span className={f.ok ? 'feature-check' : 'feature-no'}>
                      {f.ok ? '✓' : '✗'}
                    </span>
                    <span style={{ color: f.ok ? '#374151' : '#cbd5e1' }}>{f.label}</span>
                  </div>
                ))}
              </div>
              <button className={`plan-btn ${plan.btnClass}`}>
                {plan.btnLabel}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
