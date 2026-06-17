import { useState } from 'react'
import './Settings.css'

const aiRules = [
  { id: 1, name: '营业执照自动识别', field: '企业名称/注册资本/成立日期/法人', trigger: '上传营业执照时', status: '启用', priority: '高' },
  { id: 2, name: '身份证字段映射', field: '法人姓名/身份证号/地址', trigger: '上传身份证图片时', status: '启用', priority: '高' },
  { id: 3, name: '流水月均计算', field: '月均流水金额', trigger: '银行流水识别完成后', status: '启用', priority: '中' },
  { id: 4, name: '税额汇总规则', field: '近2年纳税总额', trigger: '纳税证明识别完成后', status: '停用', priority: '低' },
]

const promptConfigs = [
  {
    type: '资料识别',
    icon: '🔍',
    model: 'GPT-4o Vision',
    prompt: '你是一个专业的金融资料解析助手，请识别上传文件的类型和核心字段...',
    lastUpdate: '2026-06-10',
    status: '已启用',
  },
  {
    type: '表格填写',
    icon: '✍️',
    model: 'GPT-4o',
    prompt: '根据客户档案信息，按银行制式表格字段要求逐项填写，优先使用已识别的资料...',
    lastUpdate: '2026-06-12',
    status: '已启用',
  },
  {
    type: '材料包导出',
    icon: '📦',
    model: 'GPT-4o',
    prompt: '整理所有已识别和填写的材料，按银行要求的顺序和命名规范打包...',
    lastUpdate: '2026-06-05',
    status: '已启用',
  },
]

export default function Templates() {
  const [activeRule, setActiveRule] = useState<number | null>(null)

  return (
    <div className="settings-page">
      <div className="page-header">
        <h1 className="page-title">平台配置</h1>
      </div>

      {/* Metrics */}
      <div className="metrics-grid-4">
        <div className="metric-card" style={{ borderTop: '3px solid #2563eb' }}>
          <div className="metric-value" style={{ color: '#2563eb' }}>156</div>
          <div className="metric-label">字段映射</div>
          <div className="metric-desc">跨银行产品字段配置</div>
        </div>
        <div className="metric-card" style={{ borderTop: '3px solid #16a34a' }}>
          <div className="metric-value" style={{ color: '#16a34a' }}>12</div>
          <div className="metric-label">AI填写策略</div>
          <div className="metric-desc">已配置自动化规则</div>
        </div>
        <div className="metric-card" style={{ borderTop: '3px solid #d97706' }}>
          <div className="metric-value" style={{ color: '#d97706' }}>8</div>
          <div className="metric-label">顾问复核规则</div>
          <div className="metric-desc">触发人工审核条件</div>
        </div>
        <div className="metric-card" style={{ borderTop: '3px solid #9333ea' }}>
          <div className="metric-value" style={{ color: '#9333ea' }}>已开启</div>
          <div className="metric-label">机构私有化配置</div>
          <div className="metric-desc">独立Prompt & 规则</div>
        </div>
      </div>

      {/* AI Fill Rules */}
      <div className="section">
        <div className="section-header">
          <h2 className="section-title">AI填表规则</h2>
          <button className="btn btn-primary">+ 新增规则</button>
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
              {aiRules.map((rule) => (
                <tr
                  key={rule.id}
                  className={`table-row-hover ${activeRule === rule.id ? 'row-active' : ''}`}
                  onClick={() => setActiveRule(activeRule === rule.id ? null : rule.id)}
                >
                  <td className="cell-main">{rule.name}</td>
                  <td className="cell-sub">{rule.field}</td>
                  <td className="cell-sub">{rule.trigger}</td>
                  <td>
                    <span className={`priority-badge priority-${rule.priority}`}>{rule.priority}</span>
                  </td>
                  <td>
                    <span className={`badge ${rule.status === '启用' ? 'badge-active' : 'badge-inactive'}`}>
                      {rule.status}
                    </span>
                  </td>
                  <td>
                    <div className="action-btns">
                      <button className="btn-sm btn-edit">编辑</button>
                      <button className="btn-sm btn-toggle">
                        {rule.status === '启用' ? '停用' : '启用'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Prompt configs */}
      <div className="section">
        <div className="section-header">
          <h2 className="section-title">Prompt配置</h2>
          <span className="section-desc">机构可自定义AI指令以匹配业务场景</span>
        </div>
        <div className="prompt-grid">
          {promptConfigs.map((pc) => (
            <div key={pc.type} className="card prompt-card">
              <div className="prompt-header">
                <span className="prompt-icon">{pc.icon}</span>
                <div>
                  <div className="prompt-type">{pc.type}</div>
                  <div className="prompt-model">模型：{pc.model}</div>
                </div>
                <span className="badge badge-active" style={{ marginLeft: 'auto' }}>{pc.status}</span>
              </div>
              <div className="prompt-preview">
                {pc.prompt}
              </div>
              <div className="prompt-footer">
                <span className="prompt-date">最近更新：{pc.lastUpdate}</span>
                <button className="btn-sm btn-edit-prompt">编辑 Prompt</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
