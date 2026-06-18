import { useState, useEffect } from 'react'
import { getApiConfig, regenerateApiKey, ApiApiConfig } from '../../utils/api'
import './Settings.css'

const endpoints = [
  { method: 'POST', path: '/mock/forms/fill', desc: '触发AI填表' },
  { method: 'POST', path: '/mock/documents/parse', desc: '文件识别解析' },
  { method: 'GET',  path: '/mock/customers/{id}/profile', desc: '获取客户档案' },
  { method: 'POST', path: '/mock/reports/export', desc: '导出材料包' },
  { method: 'GET',  path: '/mock/usage/stats', desc: '查询调用统计' },
]

const integrationSteps = [
  {
    num: 1, title: '获取API密钥',
    desc: '复制下方 API Key，用于请求签名认证。请勿将 Key 暴露在前端代码中。',
    code: '',
  },
  {
    num: 2, title: '添加请求头',
    desc: '在每次 HTTP 请求的 Header 中携带以下字段：',
    code: `Authorization: Bearer tk_your_api_key_here\nContent-Type: application/json\nX-Org-Id: org_xxxxxxxxxxxx`,
  },
  {
    num: 3, title: '调用填表接口',
    desc: '传入客户 ID 和目标银行产品，AI 自动完成字段填写：',
    code: `POST /mock/forms/fill\n{\n  "customerId": "c001",\n  "bankId": "b001",\n  "productId": "p001"\n}`,
  },
  {
    num: 4, title: '轮询结果',
    desc: '填表为异步操作，可通过 taskId 查询进度：',
    code: `GET /mock/tasks/{taskId}/status\n→ { "status": "completed", "filledFields": 28, "totalFields": 35 }`,
  },
]

function Spinner() {
  return <div className="spinner-wrap"><div className="spinner" /></div>
}

export default function ApiConfig() {
  const [config, setConfig] = useState<ApiApiConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [regenerating, setRegenerating] = useState(false)
  const [newKeyDisplay, setNewKeyDisplay] = useState<string | null>(null)

  useEffect(() => {
    getApiConfig()
      .then(setConfig)
      .catch(() => setConfig(null))
      .finally(() => setLoading(false))
  }, [])

  function handleCopy(text: string) {
    void navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  async function handleRegenerate() {
    if (!confirm('重新生成 API Key 将使当前 Key 立即失效，确认继续？')) return
    setRegenerating(true)
    try {
      const result = await regenerateApiKey()
      setConfig(result)
      if (result.apiKeyFull) setNewKeyDisplay(result.apiKeyFull)
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : '重新生成失败')
    } finally {
      setRegenerating(false)
    }
  }

  const maskedKey = config?.apiKeyMasked ?? 'tk_live_b3a8f2e1c94d••••••••••••••••••4e1'

  const metrics = [
    { label: 'API状态', value: config?.status ?? '已开通', color: '#16a34a', bg: '#f0fdf4' },
    { label: '本月调用', value: config?.monthlyUsage ?? '—', color: '#2563eb', bg: '#eff6ff' },
    { label: '月度限额', value: config ? (config.monthlyQuota === -1 ? '无限制' : config.monthlyQuota) : '—', color: '#d97706', bg: '#fffbeb' },
    { label: '接口状态', value: 'Mock', color: '#9333ea', bg: '#fdf4ff' },
  ]

  return (
    <div className="settings-page">
      <div className="page-header">
        <h1 className="page-title">API配置</h1>
      </div>

      <div className="metrics-grid-4">
        {metrics.map(m => (
          <div key={m.label} className="metric-card" style={{ borderTop: `3px solid ${m.color}`, background: m.bg }}>
            <div className="metric-value" style={{ color: m.color }}>{m.value}</div>
            <div className="metric-label">{m.label}</div>
            <div className="metric-desc">当前机构账号</div>
          </div>
        ))}
      </div>

      {loading && <Spinner />}

      <div className="api-layout">
        {/* Left: config */}
        <div>
          <div className="section">
            <div className="section-header">
              <h2 className="section-title">API密钥</h2>
            </div>
            <div className="card">
              <div style={{ fontSize: 13, color: '#64748b', marginBottom: 8 }}>
                机构专属密钥，用于所有 API 请求的身份验证。
              </div>

              {newKeyDisplay && (
                <div className="new-key-alert">
                  <div className="new-key-label">新 Key 已生成，请立即复制保存（仅显示一次）：</div>
                  <div className="api-key-box" style={{ background: '#f0fdf4', borderColor: '#bbf7d0' }}>
                    <span className="api-key-text" style={{ color: '#166534' }}>{newKeyDisplay}</span>
                    <button className="btn-sm btn-copy" onClick={() => handleCopy(newKeyDisplay)}>
                      {copied ? '已复制 ✓' : '复制'}
                    </button>
                  </div>
                  <button className="btn-sm btn-stop" style={{ marginTop: 6 }} onClick={() => setNewKeyDisplay(null)}>
                    关闭提示
                  </button>
                </div>
              )}

              {!newKeyDisplay && (
                <>
                  <div className="api-key-box">
                    <span className="api-key-text">{maskedKey}</span>
                    <button className="btn-sm btn-copy" onClick={() => handleCopy(maskedKey)}>
                      {copied ? '已复制 ✓' : '复制'}
                    </button>
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 8, alignItems: 'center' }}>
                    <button className="btn-sm btn-edit" onClick={handleRegenerate} disabled={regenerating}>
                      {regenerating ? '生成中...' : '重新生成'}
                    </button>
                    {config?.createdAt && (
                      <span style={{ fontSize: 12, color: '#94a3b8' }}>
                        创建于 {config.createdAt.slice(0, 10)} · 永久有效
                      </span>
                    )}
                  </div>
                </>
              )}
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
                {endpoints.map(ep => (
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

        {/* Right: integration guide */}
        <div>
          <div className="section">
            <div className="section-header">
              <h2 className="section-title">接入指南</h2>
            </div>
            <div className="card">
              <div className="integration-steps">
                {integrationSteps.map(step => (
                  <div key={step.num} className="integration-step">
                    <div className="step-num">{step.num}</div>
                    <div className="step-content">
                      <div className="step-title">{step.title}</div>
                      <div className="step-desc">{step.desc}</div>
                      {step.code && <pre className="step-code">{step.code}</pre>}
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
