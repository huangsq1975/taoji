import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { mockFillTasks } from '../../utils/mock'
import './ReportDetail.css'

const TABS = ['复核', '基础主体资料', '征信授权资料', '经营财务资料', '用途与增信资料']

const reviewItems = [
  { field: '企业名称', value: '苏州盛晨科技有限公司', source: '营业执照', status: '通过', note: '' },
  { field: '统一社会信用代码', value: '91320594MA1XXXX12X', source: '营业执照', status: '通过', note: '' },
  { field: '法人姓名', value: '陈建明', source: '身份证', status: '通过', note: '' },
  { field: '注册资本（万元）', value: '1000', source: '营业执照', status: '通过', note: '' },
  { field: '月均流水（万元）', value: '未提取到', source: '—', status: '问题', note: '对公流水未上传' },
  { field: '近2年纳税总额（万元）', value: '未提取到', source: '—', status: '问题', note: '纳税证明缺失' },
]

const basicFields = [
  { field: '企业全称', value: '苏州盛晨科技有限公司', source: '营业执照', conf: 99 },
  { field: '法人代表', value: '陈建明', source: '身份证', conf: 97 },
  { field: '注册地址', value: '江苏省苏州市工业园区XX路XX号', source: '营业执照', conf: 95 },
  { field: '注册资本', value: '人民币壹千万元整', source: '营业执照', conf: 98 },
  { field: '经营范围', value: '软件开发、技术服务...', source: '营业执照', conf: 91 },
  { field: '成立日期', value: '2018年03月15日', source: '营业执照', conf: 99 },
]

const creditFields = [
  { field: '法人征信授权书', value: '已上传（待确认）', source: '客户上传', conf: 88 },
  { field: '征信查询次数（近1年）', value: '未提取到', source: '—', conf: 0 },
  { field: '个人不良记录', value: '未提取到', source: '—', conf: 0 },
  { field: '企业信用报告日期', value: '2026年05月30日', source: '企业信用报告', conf: 96 },
]

const bizFields = [
  { field: '近1年营业收入（万元）', value: '2340', source: '财务报表', conf: 87 },
  { field: '近1年净利润（万元）', value: '186', source: '财务报表', conf: 85 },
  { field: '月均对公流水（万元）', value: '未提取到', source: '—', conf: 0 },
  { field: '资产负债率（%）', value: '42.3', source: '财务报表', conf: 89 },
  { field: '近2年纳税总额（万元）', value: '未提取到', source: '—', conf: 0 },
]

const purposeFields = [
  { field: '贷款用途', value: '补充生产经营所需流动资金', source: '申请表', conf: 95 },
  { field: '申请金额（万元）', value: '300', source: '申请表', conf: 99 },
  { field: '期望贷款期限', value: '3年', source: '申请表', conf: 99 },
  { field: '还款来源说明', value: '经营性收入及应收账款回款', source: '申请表', conf: 93 },
  { field: '高新企业证书编号', value: 'GR202132000XXXX', source: '高新证书', conf: 97 },
]

const tabFields = [basicFields, creditFields, bizFields, purposeFields]

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; text: string }> = {
    '待AI填写': { bg: '#eff6ff', text: '#2563eb' },
    '待处理': { bg: '#fffbeb', text: '#d97706' },
    '可导出': { bg: '#f0fdf4', text: '#16a34a' },
    '已导出': { bg: '#f8fafc', text: '#64748b' },
  }
  const c = map[status] || { bg: '#f8fafc', text: '#64748b' }
  return <span className="badge" style={{ background: c.bg, color: c.text }}>{status}</span>
}

export default function ReportDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState(0)

  const task = mockFillTasks.find((t) => t.id === id) || mockFillTasks[0]
  const pct = task.totalFields > 0 ? Math.round((task.filledFields / task.totalFields) * 100) : 0

  const passCount = reviewItems.filter((r) => r.status === '通过').length
  const issueCount = reviewItems.filter((r) => r.status === '问题').length
  const confirmCount = reviewItems.filter((r) => r.status === '需确认').length

  return (
    <div className="report-detail">
      <div className="detail-header">
        <button className="back-btn" onClick={() => navigate('/reports')}>← 返回作业台</button>
        <div className="detail-breadcrumb">
          报告作业台 › <span>{task.customerName}</span> › <span>{task.bankName} · {task.product}</span>
        </div>
      </div>

      <div className="task-header card">
        <div className="task-header-main">
          <div className="task-id">作业 #{task.id.toUpperCase()}</div>
          <h2 className="task-customer">{task.customerName}</h2>
          <div className="task-meta">
            {task.bankName} · {task.product} · 处理人：{task.reviewer} · {task.time}
          </div>
        </div>
        <div className="task-header-side">
          <StatusBadge status={task.status} />
          <div className="fill-progress-info">
            <div className="fill-progress-nums">{task.filledFields} / {task.totalFields} 字段</div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${pct}%`, background: pct === 100 ? '#16a34a' : '#2563eb' }} />
            </div>
            <div className="fill-progress-pct">{pct}% 完成</div>
          </div>
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

      {/* Review tab */}
      {activeTab === 0 && (
        <div className="tab-content">
          <div className="principle-box card">
            <h3 className="principle-title">AI复核说明</h3>
            <p className="principle-text">
              AI已自动核查所有已填写字段。标注「通过」的字段置信度≥85%，已完成数据来源溯源；「问题」字段需顾问人工干预；
              「需确认」字段建议与客户核实后再提交。所有AI生成结果须经顾问审核后方可导出，平台不承担因未经复核导致的申请风险。
            </p>
          </div>

          <div className="review-metrics">
            <div className="review-metric review-pass">
              <div className="review-metric-num">{passCount}</div>
              <div className="review-metric-label">通过</div>
            </div>
            <div className="review-metric review-confirm">
              <div className="review-metric-num">{confirmCount}</div>
              <div className="review-metric-label">需确认</div>
            </div>
            <div className="review-metric review-issue">
              <div className="review-metric-num">{issueCount}</div>
              <div className="review-metric-label">问题</div>
            </div>
          </div>

          <div className="card table-card">
            <table className="data-table">
              <thead>
                <tr>
                  <th>字段名称</th>
                  <th>AI填写值</th>
                  <th>数据来源</th>
                  <th>AI审查结果</th>
                  <th>备注</th>
                </tr>
              </thead>
              <tbody>
                {reviewItems.map((item) => (
                  <tr key={item.field}>
                    <td className="cell-main">{item.field}</td>
                    <td className={item.status === '问题' ? 'text-red' : ''}>{item.value}</td>
                    <td className="cell-sub">{item.source}</td>
                    <td>
                      <span className={`badge ${item.status === '通过' ? 'badge-ok' : item.status === '问题' ? 'badge-error' : 'badge-warn'}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="cell-note">{item.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="review-actions">
            <button className="btn btn-outline">标记全部为已确认</button>
            <button className="btn btn-primary">确认复核，准备导出</button>
          </div>
        </div>
      )}

      {/* Field tabs */}
      {activeTab > 0 && (
        <div className="tab-content">
          <div className="card table-card">
            <table className="data-table">
              <thead>
                <tr>
                  <th>字段名</th>
                  <th>AI填写值</th>
                  <th>数据来源</th>
                  <th>置信度</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {tabFields[activeTab - 1].map((f) => (
                  <tr key={f.field}>
                    <td className="cell-main">{f.field}</td>
                    <td className={f.conf === 0 ? 'text-red' : ''}>
                      {f.conf === 0 ? '未提取到' : f.value}
                    </td>
                    <td className="cell-sub">{f.source}</td>
                    <td>
                      {f.conf > 0 ? (
                        <div className="conf-wrap">
                          <div className="conf-bar">
                            <div
                              className="conf-fill"
                              style={{
                                width: `${f.conf}%`,
                                background: f.conf >= 90 ? '#16a34a' : f.conf >= 75 ? '#d97706' : '#dc2626'
                              }}
                            />
                          </div>
                          <span className={`conf-pct ${f.conf >= 90 ? 'conf-high' : f.conf >= 75 ? 'conf-mid' : 'conf-low'}`}>
                            {f.conf}%
                          </span>
                        </div>
                      ) : (
                        <span className="badge badge-error">缺数据</span>
                      )}
                    </td>
                    <td>
                      <button className="btn-sm btn-review-sm">
                        {f.conf === 0 ? '补录' : '审查'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="report-footer">
        <div className="footer-info">
          <span>共 {task.totalFields} 个字段</span>
          <span className="sep">·</span>
          <span className="text-green">{task.filledFields} 已填写</span>
          <span className="sep">·</span>
          <span className="text-red">{task.totalFields - task.filledFields} 待填写/问题</span>
        </div>
        <button className="btn btn-export-big" disabled={task.status !== '可导出'}>
          📦 导出材料包（ZIP）
        </button>
      </div>
    </div>
  )
}
