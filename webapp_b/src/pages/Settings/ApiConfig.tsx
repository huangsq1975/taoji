import { useState } from 'react'
import './Settings.css'

const endpoints = [
  { method: 'POST', path: '/mock/forms/fill', desc: '触发AI填表' },
  { method: 'POST', path: '/mock/documents/parse', desc: '文件识别解析' },
  { method: 'GET', path: '/mock/customers/{id}/profile', desc: '获取客户档案' },
  { method: 'POST', path: '/mock/reports/export', desc: '导出材料包' },
  { method: 'GET', path: '/mock/usage/stats', desc: '查询调用统计' },
]

const integrationSteps = [
  {
    num: 1,
    title: '获取API密钥',
    desc: '复制下方 API Key，用于请求签名认证。请勿将 Key 暴露在前端代码中。',
    code: '',
  },
  {
    num: 2,
    title: '添加请求头',
    desc: '在每次HTTP请求的 Header 中携带以下字段：',
    code: `Authorization: Bearer tk_your_api_key_here
Content-Type: application/json
X-Org-Id: org_xxxxxxxxxxxx`,
  },
  {
    num: 3,
    title: '调用填表接口',
    desc: '传入客户ID和目标银行产品，AI自动完成字段填写：',
    code: `POST /mock/forms/fill
{
  "customerId": "c001",
  "bankId": "b001",
  "productId": "p001"
}`,
  },
  {
    num: 4,
    title: '轮询结果',
    desc: '填表为异步操作，可通过 taskId 查询进度：',
    code: `GET /mock/tasks/{taskId}/status
→ { "status": "completed", "filledFields": 28, "totalFields": 35 }`,
  },
]

export default function ApiConfig() {
  const [copied, setCopied] = useState(false)

  const apiKey = 'tk_live_b3a8f2e1c94d71a6e0b25f3d8c79a4e1'

  function handleCopy() {
    void navigator.clipboard.writeText(apiKey).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const statusMetrics = [
    { label: 'API状态', value: '已开通', color: '#16a34a', bg: '#f0fdf4' },
    { label: '本月调用', value: 4, color: '#2563eb', bg: '#eff6ff' },
    { label: '示例扣次', value: '2-5次/产品', color: '#d97706', bg: '#fffbeb' },
    { label: '接口状态', value: 'Mock', color: '#9333ea', bg: '#fdf4ff' },
  ]

  return (
    <div className="settings-page">
      <div className="page-header">
        <h1 className="page-title">API配置</h1>
      </div>

      <div className="metrics-grid-4">
        {statusMetrics.map((m) => (
          <div key={m.label} className="metric-card" style={{ borderTop: `3px solid ${m.color}`, background: m.bg }}>
            <div className="metric-value" style={{ color: m.color }}>{m.value}</div>
            <div className="metric-label">{m.label}</div>
            <div className="metric-desc">当前机构账号</div>
          </div>
        ))}
      </div>

      <div className="api-layout">
        {/* Left: API config */}
        <div>
          <div className="section">
            <div className="section-header">
              <h2 className="section-title">API密钥</h2>
            </div>
            <div className="card">
              <div style={{ fontSize: 13, color: '#64748b', marginBottom: 8 }}>
                机构专属密钥，用于所有API请求的身份验证。
              </div>
              <div className="api-key-box">
                <span className="api-key-text">
                  {apiKey.slice(0, 10)}{'•'.repeat(16)}{apiKey.slice(-8)}
                </span>
                <button className="btn-sm btn-copy" onClick={handleCopy}>
                  {copied ? '已复制 ✓' : '复制'}
                </button>
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <button className="btn-sm btn-edit">重新生成</button>
                <span style={{ fontSize: 12, color: '#94a3b8', alignSelf: 'center' }}>
                  创建于 2026-05-01 · 永久有效
                </span>
              </div>
            </div>
          </div>

          <div className="section">
            <div className="section-header">
              <h2 className="section-title">接口列表</h2>
              <span className="badge badge-warn" style={{ marginLeft: 'auto' }}>Mock模式</span>
            </div>
            <div className="card">
              <div style={{ fontSize: 12, color: '#64748b', marginBottom: 12 }}>
                基础URL：<code style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: 4 }}>
                  https://api.taoji.ai/v1
                </code>
              </div>
              <div className="endpoint-list">
                {endpoints.map((ep) => (
                  <div key={ep.path} className="endpoint-item">
                    <span className="endpoint-method">{ep.method}</span>
                    <span className="endpoint-path">{ep.path}</span>
                    <span className="endpoint-desc">{ep.desc}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right: Integration guide */}
        <div>
          <div className="section">
            <div className="section-header">
              <h2 className="section-title">接入指南</h2>
            </div>
            <div className="card">
              <div className="integration-steps">
                {integrationSteps.map((step) => (
                  <div key={step.num} className="integration-step">
                    <div className="step-num">{step.num}</div>
                    <div className="step-content">
                      <div className="step-title">{step.title}</div>
                      <div className="step-desc">{step.desc}</div>
                      {step.code && (
                        <pre className="step-code">{step.code}</pre>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
