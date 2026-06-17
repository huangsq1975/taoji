import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { mockCustomers } from '../../utils/mock'
import './CustomerDetail.css'

const TABS = ['客户总览', '客户资料', '报告产出', '跟进记录']

const mockProfile = [
  { label: '企业名称', value: '苏州盛晨科技有限公司', icon: '🏢' },
  { label: '统一社会信用代码', value: '91320594MA1XXXX12X', icon: '🔢' },
  { label: '法定代表人', value: '陈建明', icon: '👤' },
  { label: '注册资本', value: '1000万元', icon: '💰' },
  { label: '成立日期', value: '2018年03月15日', icon: '📅' },
  { label: '经营范围', value: '软件开发、科技制造、技术服务', icon: '📝' },
]

const mockDocs = {
  complete: ['营业执照', '法人身份证（正面）', '法人身份证（背面）', '高新技术企业证书'],
  missing: ['近12个月对公流水', '近2年纳税证明'],
  invalid: ['公司章程（格式不符）'],
}

const mockReviewFields = [
  { field: '企业名称', value: '苏州盛晨科技有限公司', source: '营业执照', status: '通过' },
  { field: '法人姓名', value: '陈建明', source: '身份证', status: '通过' },
  { field: '注册资本', value: '1000万元', source: '营业执照', status: '通过' },
  { field: '月均流水', value: '未提取到', source: '—', status: '问题' },
  { field: '经营年限', value: '8年', source: '系统计算', status: '通过' },
  { field: '纳税总额', value: '未提取到', source: '—', status: '问题' },
]

const mockFollowups = [
  {
    id: 1, date: '2026-06-17 10:30', author: '张顾问',
    content: '与客户陈建明电话沟通，确认需要补充近12个月对公流水，客户表示本周可以提供。',
    type: '电话',
  },
  {
    id: 2, date: '2026-06-15 14:20', author: '张顾问',
    content: 'AI资料解析完成，营业执照、身份证识别正常。对公流水和纳税证明缺失，已生成补件清单发送给客户。',
    type: '系统',
  },
  {
    id: 3, date: '2026-06-12 09:00', author: '张顾问',
    content: '新建客户档案，客户由推荐渠道接入。目标：浦发银行科创贷300万，初步资质评估：符合国高+科小条件。',
    type: '备注',
  },
]

function PriorityBadge({ priority }: { priority: string }) {
  const map: Record<string, { bg: string; text: string }> = {
    P0: { bg: '#fef2f2', text: '#dc2626' },
    P1: { bg: '#fffbeb', text: '#d97706' },
  }
  const c = map[priority] || { bg: '#f8fafc', text: '#64748b' }
  return <span className="badge" style={{ background: c.bg, color: c.text }}>{priority}</span>
}

function StageBadge({ stage }: { stage: string }) {
  const map: Record<string, { bg: string; text: string }> = {
    '资料收集': { bg: '#f0fdf4', text: '#16a34a' },
    '顾问复核': { bg: '#eff6ff', text: '#2563eb' },
    '银行对接': { bg: '#fffbeb', text: '#d97706' },
    '下户': { bg: '#fdf4ff', text: '#9333ea' },
  }
  const c = map[stage] || { bg: '#f8fafc', text: '#64748b' }
  return <span className="badge" style={{ background: c.bg, color: c.text }}>{stage}</span>
}

export default function CustomerDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState(0)
  const [newNote, setNewNote] = useState('')

  const customer = mockCustomers.find((c) => c.id === id)

  if (!customer) {
    return (
      <div className="not-found">
        <h2>客户不存在</h2>
        <button className="btn btn-outline" onClick={() => navigate('/customers')}>返回列表</button>
      </div>
    )
  }

  const scoreColor = customer.profileScore >= 80 ? '#16a34a' : customer.profileScore >= 60 ? '#d97706' : '#dc2626'

  return (
    <div className="customer-detail">
      {/* Header */}
      <div className="detail-header">
        <button className="back-btn" onClick={() => navigate('/customers')}>← 返回列表</button>
        <div className="detail-title-row">
          <h1 className="detail-title">{customer.name}</h1>
          <div className="detail-tags">
            <PriorityBadge priority={customer.priority} />
            <span className="badge badge-risk-low">风险 {customer.risk}</span>
            <StageBadge stage={customer.stage} />
            <span className="score-badge" style={{ borderColor: scoreColor, color: scoreColor }}>
              资料评分 {customer.profileScore}
            </span>
          </div>
        </div>
        <div className="detail-meta">
          <span>{customer.industry}</span>
          <span className="sep">·</span>
          <span>法人：{customer.owner}</span>
          <span className="sep">·</span>
          <span>目标：{customer.bank} {customer.product} {customer.amount}</span>
          <span className="sep">·</span>
          <span>顾问：{customer.advisor}</span>
          <span className="sep">·</span>
          <span>最后更新：{customer.last}</span>
        </div>
      </div>

      {/* Tabs */}
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

      {/* Tab content */}
      {activeTab === 0 && (
        <div className="tab-content">
          {/* Readiness card */}
          <div className="readiness-card card">
            <div className="readiness-score" style={{ borderColor: scoreColor }}>
              <div className="readiness-num" style={{ color: scoreColor }}>{customer.profileScore}</div>
              <div className="readiness-label">资料完整度评分</div>
            </div>
            <div className="readiness-info">
              <h3 className="readiness-title">资料准备状态</h3>
              <div className="readiness-progress">
                <div className="progress-bar-wide">
                  <div className="progress-fill-wide" style={{ width: `${customer.complete}%`, background: scoreColor }} />
                </div>
                <span className="readiness-pct">{customer.complete}% 完整</span>
              </div>
              {customer.block !== '无' && (
                <div className="block-alert">
                  <span className="block-icon">⚠️</span>
                  <div>
                    <div className="block-title">当前卡点</div>
                    <div className="block-content">{customer.block}</div>
                  </div>
                </div>
              )}
              <div className="next-action">
                <span className="next-icon">→</span>
                <span className="next-text">下一步：{customer.next}</span>
              </div>
            </div>
            <div className="qual-section">
              <div className="qual-title">企业资质</div>
              <div className="qual-tags">
                {customer.qual.map((q) => (
                  <span key={q} className="qual-tag-lg">{q}</span>
                ))}
              </div>
            </div>
          </div>

          {/* 360 profile */}
          <h3 className="section-title">企业360°画像</h3>
          <div className="profile-grid">
            {mockProfile.map((item) => (
              <div key={item.label} className="profile-card card">
                <div className="profile-card-icon">{item.icon}</div>
                <div className="profile-card-label">{item.label}</div>
                <div className="profile-card-value">{item.value}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 1 && (
        <div className="tab-content">
          <div className="doc-actions">
            <button className="btn btn-primary">📎 上传资料</button>
            <button className="btn btn-outline">📋 生成补件清单</button>
          </div>
          <div className="doc-grid">
            <div className="doc-section card">
              <h3 className="doc-section-title doc-complete">✅ 已齐全 ({mockDocs.complete.length})</h3>
              <ul className="doc-list">
                {mockDocs.complete.map((d) => (
                  <li key={d} className="doc-item doc-item-ok">
                    <span className="doc-icon">✓</span>{d}
                  </li>
                ))}
              </ul>
            </div>
            <div className="doc-section card">
              <h3 className="doc-section-title doc-missing">❌ 缺失 ({mockDocs.missing.length})</h3>
              <ul className="doc-list">
                {mockDocs.missing.map((d) => (
                  <li key={d} className="doc-item doc-item-missing">
                    <span className="doc-icon">✗</span>{d}
                  </li>
                ))}
              </ul>
            </div>
            <div className="doc-section card">
              <h3 className="doc-section-title doc-invalid">⚠️ 格式异常 ({mockDocs.invalid.length})</h3>
              <ul className="doc-list">
                {mockDocs.invalid.map((d) => (
                  <li key={d} className="doc-item doc-item-warn">
                    <span className="doc-icon">!</span>{d}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <h3 className="section-title" style={{ marginTop: 24 }}>材料要求参照表（{customer.bank} · {customer.product}）</h3>
          <div className="card table-card">
            <table className="data-table">
              <thead>
                <tr>
                  <th>材料名称</th>
                  <th>是否必须</th>
                  <th>来源渠道</th>
                  <th>格式要求</th>
                  <th>状态</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>营业执照</td>
                  <td><span className="badge badge-required">必须</span></td>
                  <td>客户上传</td>
                  <td>PDF/图片</td>
                  <td><span className="badge badge-ok">已上传</span></td>
                </tr>
                <tr>
                  <td>法人身份证</td>
                  <td><span className="badge badge-required">必须</span></td>
                  <td>客户上传</td>
                  <td>PDF/图片</td>
                  <td><span className="badge badge-ok">已上传</span></td>
                </tr>
                <tr>
                  <td>近12个月对公流水</td>
                  <td><span className="badge badge-required">必须</span></td>
                  <td>客户上传</td>
                  <td>PDF</td>
                  <td><span className="badge badge-miss">缺失</span></td>
                </tr>
                <tr>
                  <td>近2年纳税证明</td>
                  <td><span className="badge badge-required">必须</span></td>
                  <td>电子税务局</td>
                  <td>PDF</td>
                  <td><span className="badge badge-miss">缺失</span></td>
                </tr>
                <tr>
                  <td>高新技术企业证书</td>
                  <td><span className="badge badge-optional">选填</span></td>
                  <td>客户上传</td>
                  <td>PDF/图片</td>
                  <td><span className="badge badge-ok">已上传</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 2 && (
        <div className="tab-content">
          <div className="report-header-row">
            <div className="report-product-selector">
              <span className="selector-label">目标产品：</span>
              <select className="filter-select">
                <option>{customer.bank} · {customer.product}</option>
              </select>
            </div>
            <div className="report-actions">
              <button className="btn btn-primary">🤖 触发AI填写</button>
              <button className="btn btn-outline">📦 导出材料包</button>
            </div>
          </div>
          <div className="card table-card" style={{ marginTop: 16 }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>字段名</th>
                  <th>AI填写值</th>
                  <th>数据来源</th>
                  <th>置信度</th>
                  <th>审查状态</th>
                </tr>
              </thead>
              <tbody>
                {mockReviewFields.map((f) => (
                  <tr key={f.field}>
                    <td className="cell-main">{f.field}</td>
                    <td className={f.status === '问题' ? 'text-red' : ''}>{f.value}</td>
                    <td className="cell-sub">{f.source}</td>
                    <td>
                      {f.status !== '问题' ? (
                        <div className="progress-wrap">
                          <div className="progress-bar-sm">
                            <div className="progress-fill" style={{ width: '92%' }} />
                          </div>
                          <span>92%</span>
                        </div>
                      ) : '—'}
                    </td>
                    <td>
                      <span className={`badge ${f.status === '通过' ? 'badge-ok' : 'badge-error'}`}>
                        {f.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 3 && (
        <div className="tab-content">
          <div className="followup-list">
            {mockFollowups.map((f) => (
              <div key={f.id} className="followup-item">
                <div className="followup-timeline">
                  <div className="followup-dot" />
                  <div className="followup-line" />
                </div>
                <div className="followup-body card">
                  <div className="followup-header">
                    <span className="followup-author">{f.author}</span>
                    <span className={`followup-type type-${f.type}`}>{f.type}</span>
                    <span className="followup-date">{f.date}</span>
                  </div>
                  <div className="followup-content">{f.content}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="new-note card">
            <h3 className="section-title" style={{ marginBottom: 12 }}>添加跟进记录</h3>
            <textarea
              className="note-textarea"
              placeholder="记录本次跟进情况、重要节点、待办事项..."
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              rows={4}
            />
            <div className="note-footer">
              <div className="note-type-btns">
                <button className="type-btn">📞 电话</button>
                <button className="type-btn">✍️ 备注</button>
                <button className="type-btn">📧 邮件</button>
              </div>
              <button className="btn btn-primary" disabled={!newNote.trim()}>
                提交记录
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
